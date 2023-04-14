//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const _ = require("lodash");

require("dotenv").config();
console.log(process.env)
mongoose.set('strictQuery', false);

const app = express();




const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const connectDB = async () => {
  try {
    mongoose.connect("mongodb+srv://"+process.env.ADMIN_NAME +":"+process.env.ADMIN_PASS+"@cluster0.nerrton.mongodb.net/todoListDB1?retryWrites=true&w=majority", {
      useNewUrlParser: true
    });
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.log("NEW ERROR "+ error);
    process.exit(1);
  }
}





const itemsSchema = {
  name: String
};
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "welcome to your to do list"
});
const item2 = new Item({
  name: "<---hit this to delete an item2"
});
const item3 = new Item({
  name: "hit + button to add a new item"
});

const defaultItems = [item1, item2, item3];

// створємо нову схему і колекцію
const listSchema = {
  name: String,
  //ряд елементів
  items: [itemsSchema]
};

//створюємо нову модель
const List = mongoose.model('List', listSchema)

app.get("/", function(req, res) {
  //структура model.find({}).then({}).catch({})

  Item.find({}).then(function(foundItems) {

      // перевіряє чи є фаунд айтеми дорівнюють 0, якщо так тоді додає дефолтні 3 айтеми
      if (foundItems.length === 0) {

        Item.insertMany(defaultItems)
          .then(function(result) {
            console.log("Successfully saved defult items to DB for 1-st time");
            // // оновлює сторінку
            // res.redirect("/");
          })

          .catch(function(err) {
            console.log(err);
          });
        // оновлює сторінку
        res.redirect("/");
      } else {
        //рендерить вже знайдені файли
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
        console.log("we have items to display");
      }

    })
    .catch(function(err) {
      console.log(err);
    })

});



app.post("/", function(req, res) {
  //коли в форму додають новийАйтем, вона стає константою айтемНейм
  const itemName = req.body.newItem; // нейм інпут
  const listName = req.body.list; //нейм кнопки
  //створюємо нову модель (айтем), в якому буде нейм -  новостворена константа константи
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    //зберігаємося і редірект
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }).then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch(err => console.log(err));

  }

});


app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then(function(foundItem) {

        Item.deleteOne({
          _id: checkedItemId
        });
        console.log("item id" + checkedItemId + " deleted");
      })
      .catch(function(err) {
        console.log(err);
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }).then(function(foundList) {
      res.redirect("/" + listName);
    });
  }
});



app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName); //тут використали лодаш _.капітелайз(стрінг)

  List.findOne({
    name: customListName
  }).then(foundList => {
    if (foundList) {
      console.log("exists");
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items
      });

    } else {

      const list = new List({
        name: customListName,
        items: defaultItems
      });
      console.log("list doesn't exist. Added new list with name/// " + customListName);
      list.save();
      res.redirect("/" + customListName);

    }

  }).catch(err => console.log(err.body));
});



app.get("/about", function(req, res) {
  res.render("about");
});

//Connect to the database before listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
