//jshint esversion:6
const express = require("express"),
      bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
      _ = require("lodash"),
      app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.DATABASEURL, {
    useNewUrlParser: true,
    useCreateIndex: true
}).then(() => {
    console.log("Connected to DB!");
}).catch(err => {
    console.log("ERROR:", err.message);
});

// S C H E M A S
const itemsSchema = {name: String},
      listSchema = {name: String, items: [itemsSchema]};

// M O D E L S
const Item = mongoose.model("Item", itemsSchema),
      List = mongoose.model("List", listSchema);

// Default ToDos
const item1 = new Item ({name: "Welcome to your todolist!"}),
      item2 = new Item ({name: "Hit the + button to add a new item."}),
      item3 = new Item ({name: "<-- Hit this to delete an item."}),
      defaultItems = [item1, item2, item3];

// R O U T E S
app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Items successfully saved to DB.");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // Create a new list and redirect
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem,
        listName = req.body.list,
        item = new Item ({name: itemName});
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox,
        listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Item successfully removed...");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

// S E R V E R
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully...");
});
