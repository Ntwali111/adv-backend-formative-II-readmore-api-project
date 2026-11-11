const express = require('express');
const router = express.Router();
const c = require('../controllers/authorController');

router.post('/', c.createAuthor);
router.get('/', c.getAuthors);
router.get('/:id', c.getAuthorById);
router.put('/:id', c.updateAuthor);
router.delete('/:id', c.deleteAuthor);
router.get('/:id/books', c.getAuthorBooks);
router.get('/:id/stats', c.getAuthorStats);

module.exports = router;