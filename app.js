//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/todolistDB', {
	useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
	name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
	name: 'Work',
});

const item2 = new Item({
	name: 'Read the book',
});

const item3 = new Item({
	name: 'Clean the house',
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
	name: String,
	items: [itemsSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
	Item.find({}, function (err, items) {
		if (items.length === 0) {
			Item.insertMany(defaultItems, function (err) {
				err
					? console.log(err)
					: console.log('Succesfully saved all items');
			});
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', newListItems: items });
		}
	});
});

app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, results) {
		if (results) {
			res.render('list', {
				listTitle: results.name,
				newListItems: results.items,
			});
		} else {
			const list = new List({
				name: customListName,
				items: defaultItems,
			});
			list.save();
			res.redirect('/' + customListName);
		}
	});
});

app.post('/', function (req, res) {
	const listName = req.body.list;
	const itemName = new Item({
		name: req.body.newItem,
	});

	if (listName === 'Today') {
		itemName.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function (err, results) {
			results.items.push(itemName);
			results.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			err ? console.log(err) : console.log('Documento eliminato!');
		});
		res.redirect('/');
	} else {
		//rimuovo dall'array l'item selezionato
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemId } } },
			function (err, foundList) {
				if (!err) res.redirect('/' + listName);
			}
		);
	}
});

app.get('/about', function (req, res) {
	res.render('about');
});

app.listen(3000, function () {
	console.log('Server started on port 3000');
});
