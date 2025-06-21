const { createApp } = Vue;

createApp({
  data() {
    return {
      src: '',           // holds current dog image URL
      sliderValue: 0     // binds to your range input
    };
  },
  methods: {
    async fetchDog() {
      try {
        const res  = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await res.json();
        this.src = data.message;
        // reset the slider so they have to drag again
        this.sliderValue = 0;
      } catch (e) {
        console.error('Failed to load dog', e);
      }
    }
  },
  mounted() {
    // load first dog, but button remains disabled until slider=100
    this.fetchDog();
  }
}).mount('#app');