
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Author = require('../models/Author');

// Check whether an ID has a valid MongoDB format
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared validation rules for creating and updating books
const checkBookRules = async ({ title, price, publishedYear, author }, excludeId = null) => {

  // Rule 1: The author must exist
  if (!isValidId(author) || !(await Author.exists({ _id: author }))) {
    return { status: 400, message: 'Author does not exist' };
  }

  // Rule 3: Validate price and published year
  if (price !== undefined && price <= 0) {
    return { status: 422, message: 'Price must be greater than 0' };
  }

  const currentYear = new Date().getFullYear();

  if (publishedYear !== undefined && (publishedYear < 1450 || publishedYear > currentYear)) {
    return {
      status: 422,
      message: `Published year must be between 1450 and ${currentYear}`
    };
  }

  // Rule 2: Prevent duplicate titles for the same author
  if (title) {
    const duplicate = await Book.findOne({
      author,
      title: title.trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {})
    }).collation({ locale: 'en', strength: 2 });

    if (duplicate) {
      return {
        status: 409,
        message: 'This author already has a book with that title'
      };
    }
  }

  return null;
};

// Create a book
exports.createBook = async (req, res) => {
  try {
    const { title, genre, price, publishedYear, author } = req.body;

    const problem = await checkBookRules(req.body);

    if (problem) {
      return res.status(problem.status).json({ message: problem.message });
    }

    const book = await Book.create({
      title,
      genre,
      price,
      publishedYear,
      author
    });

    const populated = await book.populate('author');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all books (filtering comes in Step 4)
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().populate('author');
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one book
exports.getBookById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findById(req.params.id).populate('author');

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const existing = await Book.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Combine existing values with new values for partial updates
    const merged = {
      title: existing.title,
      price: existing.price,
      publishedYear: existing.publishedYear,
      author: existing.author.toString(),
      ...req.body
    };

    const problem = await checkBookRules(merged, existing._id);

    if (problem) {
      return res.status(problem.status).json({ message: problem.message });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('author');

    res.json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
