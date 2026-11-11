const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createAuthor = async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuthors = async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuthorById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Author not found' });
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAuthor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Author not found' });
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!author) return res.status(404).json({ message: 'Author not found' });
    res.json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAuthor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Author not found' });
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });

    // TODO (Rule 4, Option A, block): count this author's books with Book.countDocuments.
    // If the count is greater than 0, return status 409 with a clear message.

    await author.deleteOne();
    res.json({ message: 'Author deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuthorBooks = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Author not found' });
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });
    const books = await Book.find({ author: req.params.id });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuthorStats = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Author not found' });
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found' });

    const books = await Book.find({ author: req.params.id });

    // TODO (Rule 6): if books.length is 0, return
    //   { author: author.name, bookCount: 0, averagePrice: 0, cheapestBook: null, mostExpensiveBook: null }
    // Otherwise compute: bookCount, averagePrice (sum of prices / count, rounded to 2 decimals),
    // cheapestBook and mostExpensiveBook (the TITLES; hint: use reduce or sort a copy).
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};