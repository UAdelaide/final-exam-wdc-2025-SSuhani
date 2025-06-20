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
      data() { return { src: '' } },
      methods: {
        async fetchDog() {
          try {
            const res = await fetch('https://dog.ceo/api/breeds/image/random');
            const json = await res.json();
            this.src = json.message;
          } catch (e) {
            console.error('Failed to load dog');
          }
        }
      },
      mounted() { this.fetchDog() }
    }).mount('#app');
