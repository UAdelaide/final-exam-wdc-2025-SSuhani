var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;



// index.js
const { createApp } = Vue;

createApp({
  methods: {
    async fetchDog() {
      try {
        const res = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await res.json();
        // Update the image src
        document.getElementById('dog-img').src = data.message;
      } catch (e) {
        console.error('Failed to load dog');
      }
    }
  },
  mounted() {
    // Initial load
    this.fetchDog();
    // Wire up the button
    document.getElementById('refresh-btn')
            .addEventListener('click', () => this.fetchDog());
  }
}).mount('#app');

