
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Author = require('../models/Author');

// Check whether an ID has a valid MongoDB format
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Shared validation rules for creating and updating books
const checkBookRules = async (
  { title, price, publishedYear, author },
  excludeId = null
) => {
  // Rule 1: The author must exist
  if (!isValidId(author)) {
    return {
      status: 400,
      message: 'Invalid author ID'
    };
  }

  const existingAuthor = await Author.findById(author);

  if (!existingAuthor) {
    return {
      status: 400,
      message: 'Author does not exist'
    };
  }

  // Rule 2: Price must be greater than zero
  if (!Number.isFinite(price) || price <= 0) {
    return {
      status: 422,
      message: 'Price must be greater than zero'
    };
  }

  // Rule 3: Published year must be between 1450 and the current year
  const currentYear = new Date().getFullYear();

  if (
    !Number.isInteger(Number(publishedYear)) ||
    Number(publishedYear) < 1450 ||
    Number(publishedYear) > currentYear
  ) {
    return {
      status: 422,
      message: `Published year must be between 1450 and ${currentYear}`
    };
  }

  // Rule 4: No duplicate book titles for the same author
  const duplicateQuery = {
    author,
    title: {
      $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      $options: 'i'
    }
  };

  if (excludeId) {
    duplicateQuery._id = { $ne: excludeId };
  }

  const duplicateBook = await Book.findOne(duplicateQuery);

  if (duplicateBook) {
    return {
      status: 409,
      message: 'This author already has a book with this title'
    };
  }

  return null;
};

// Create a new book
exports.createBook = async (req, res) => {
  try {
    const { title, price, publishedYear, author } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(422).json({
        message: 'Book title is required'
      });
    }

    const validationError = await checkBookRules({
      title: String(title).trim(),
      price: Number(price),
      publishedYear: Number(publishedYear),
      author
    });

    if (validationError) {
      return res.status(validationError.status).json({
        message: validationError.message
      });
    }

    const book = await Book.create({
      ...req.body,
      title: String(title).trim(),
      price: Number(price),
      publishedYear: Number(publishedYear)
    });

    const populatedBook = await Book.findById(book._id).populate('author');

    res.status(201).json(populatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all books with filtering, searching, sorting and pagination
exports.getBooks = async (req, res) => {
  try {
    const {
      genre,
      minPrice,
      maxPrice,
      author,
      search,
      sort,
      order = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Filter by genre
    if (genre) {
      filter.genre = genre;
    }

    // Filter by author
    if (author) {
      if (!isValidId(author)) {
        return res.status(400).json({
          message: 'Invalid author ID'
        });
      }

      filter.author = author;
    }

    // Filter by minimum and maximum price
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};

      if (minPrice !== undefined) {
        const min = Number(minPrice);

        if (!Number.isFinite(min)) {
          return res.status(400).json({
            message: 'minPrice must be a valid number'
          });
        }

        filter.price.$gte = min;
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);

        if (!Number.isFinite(max)) {
          return res.status(400).json({
            message: 'maxPrice must be a valid number'
          });
        }

        filter.price.$lte = max;
      }

      if (
        filter.price.$gte !== undefined &&
        filter.price.$lte !== undefined &&
        filter.price.$gte > filter.price.$lte
      ) {
        return res.status(400).json({
          message: 'minPrice cannot be greater than maxPrice'
        });
      }
    }

    // Search by book title (case-insensitive)
    if (search) {
      filter.title = {
        $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i'
      };
    }

    // Validate pagination
    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageLimit) ||
      currentPage < 1 ||
      pageLimit < 1
    ) {
      return res.status(400).json({
        message: 'Page and limit must be positive integers'
      });
    }

    // Validate sorting
    const allowedSortFields = ['price', 'title', 'publishedYear'];
    const sortOptions = {};

    if (sort) {
      if (!allowedSortFields.includes(sort)) {
        return res.status(400).json({
          message: 'Sort must be price, title, or publishedYear'
        });
      }

      if (!['asc', 'desc'].includes(order)) {
        return res.status(400).json({
          message: 'Order must be asc or desc'
        });
      }

      sortOptions[sort] = order === 'desc' ? -1 : 1;
    }

    const total = await Book.countDocuments(filter);

    const books = await Book.find(filter)
      .populate('author')
      .sort(sortOptions)
      .skip((currentPage - 1) * pageLimit)
      .limit(pageLimit);

    res.json({
      page: currentPage,
      limit: pageLimit,
      total,
      results: books
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one book by ID
exports.getBookById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const book = await Book.findById(req.params.id).populate('author');

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    const { title, price, publishedYear, author } = req.body;

    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const existingBook = await Book.findById(req.params.id);

    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const updatedData = {
      title: title !== undefined ? String(title).trim() : existingBook.title,
      price: price !== undefined ? Number(price) : existingBook.price,
      publishedYear:
        publishedYear !== undefined
          ? Number(publishedYear)
          : existingBook.publishedYear,
      author: author ?? existingBook.author
    };

    if (!updatedData.title) {
      return res.status(422).json({
        message: 'Book title is required'
      });
    }

    const validationError = await checkBookRules(
      updatedData,
      req.params.id
    );

    if (validationError) {
      return res.status(validationError.status).json({
        message: validationError.message
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('author');

    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    res.json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
