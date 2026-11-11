const express = require('express');
const router = express.Router();
const c = require('../controllers/bookController');

router.post('/', c.createBook);
router.get('/', c.getBooks);
router.get('/:id', c.getBookById);
router.put('/:id', c.updateBook);
router.delete('/:id', c.deleteBook);

module.exports = router;