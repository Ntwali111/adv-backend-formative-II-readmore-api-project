
const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create an author
exports.createAuthor = async (req, res) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all authors
exports.getAuthors = async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one author
exports.getAuthorById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json(author);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an author
exports.updateAuthor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json(author);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an author only if they have no books (Rule 4)
exports.deleteAuthor = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const bookCount = await Book.countDocuments({
      author: author._id
    });

    if (bookCount > 0) {
      return res.status(409).json({
        message: `Cannot delete: this author still has ${bookCount} book(s). Delete or move them first.`
      });
    }

    await author.deleteOne();

    res.json({ message: 'Author deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all books belonging to an author
exports.getAuthorBooks = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const books = await Book.find({
      author: req.params.id
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get author statistics (Rule 6)
exports.getAuthorStats = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const books = await Book.find({
      author: req.params.id
    });

    // Handle authors who have no books
    if (books.length === 0) {
      return res.json({
        author: author.name,
        bookCount: 0,
        averagePrice: 0,
        cheapestBook: null,
        mostExpensiveBook: null
      });
    }

    // Calculate total price of all books
    const totalPrice = books.reduce(
      (sum, book) => sum + book.price,
      0
    );

    // Find the cheapest book
    const cheapest = books.reduce((min, book) =>
      book.price < min.price ? book : min
    );

    // Find the most expensive book
    const priciest = books.reduce((max, book) =>
      book.price > max.price ? book : max
    );

    // Return author statistics
    res.json({
      author: author.name,
      bookCount: books.length,
      averagePrice: Number(
        (totalPrice / books.length).toFixed(2)
      ),
      cheapestBook: cheapest.title,
      mostExpensiveBook: priciest.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
