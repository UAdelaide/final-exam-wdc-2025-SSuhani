const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Sample database structure (replace with your actual database queries)
const sampleData = {
  dogs: [
    { id: 1, name: "Max", size: "medium", owner_id: 1 },
    { id: 2, name: "Bella", size: "small", owner_id: 2 },
    { id: 3, name: "Charlie", size: "large", owner_id: 1 }
  ],
  users: [
    { id: 1, username: "alice123", type: "owner" },
    { id: 2, username: "carol123", type: "owner" },
    { id: 3, username: "bobwalker", type: "walker" },
    { id: 4, username: "newwalker", type: "walker" }
  ],
  walkRequests: [
    {
      id: 1,
      dog_id: 1,
      requested_time: "2025-06-10T08:00:00.000Z",
      duration_minutes: 30,
      location: "Parklands",
      status: "open"
    },
    {
      id: 2,
      dog_id: 2,
      requested_time: "2025-06-11T14:00:00.000Z",
      duration_minutes: 45,
      location: "City Park",
      status: "completed"
    }
  ],
  walks: [
    { id: 1, walker_id: 3, request_id: 2, rating: 5 },
    { id: 2, walker_id: 3, request_id: 3, rating: 4 }
  ]
};

// Helper function to get user by ID
const getUserById = (id) => sampleData.users.find(user => user.id === id);

// Helper function to get dog by ID
const getDogById = (id) => sampleData.dogs.find(dog => dog.id === id);

// Route 1: /api/dogs - Return all dogs with size and owner's username
app.get('/api/dogs', (req, res) => {
  try {
    const [dogs] = sampleData.dogs.map(dog => {
      const owner = getUserById(dog.owner_id);
      return {
        dog_name: dog.name,
        size: dog.size,
        owner_username: owner ? owner.username : null
      };
    });

    res.json(dogsWithOwners);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve dogs data'
    });
  }
});

// Route 2: /api/walkrequests/open - Return all open walk requests
app.get('/api/walkrequests/open', (req, res) => {
  try {
    const openRequests = sampleData.walkRequests
      .filter(request => request.status === 'open')
      .map(request => {
        const dog = getDogById(request.dog_id);
        const owner = dog ? getUserById(dog.owner_id) : null;

        return {
          request_id: request.id,
          dog_name: dog ? dog.name : null,
          requested_time: request.requested_time,
          duration_minutes: request.duration_minutes,
          location: request.location,
          owner_username: owner ? owner.username : null
        };
      });

    res.json(openRequests);
  } catch (error) {
    console.error('Error fetching open walk requests:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve open walk requests'
    });
  }
});

// Route 3: /api/walkers/summary - Return walker summary with ratings and completed walks
app.get('/api/walkers/summary', (req, res) => {
  try {
    const walkers = sampleData.users.filter(user => user.type === 'walker');

    const walkerSummaries = walkers.map(walker => {
      // Get all walks for this walker
      const walkerWalks = sampleData.walks.filter(walk => walk.walker_id === walker.id);

      // Calculate ratings
      const ratingsWithValues = walkerWalks.filter(walk => walk.rating != null);
      const totalRatings = ratingsWithValues.length;
      const averageRating = totalRatings > 0
        ? ratingsWithValues.reduce((sum, walk) => sum + walk.rating, 0) / totalRatings
        : null;

      return {
        walker_username: walker.username,
        total_ratings: totalRatings,
        average_rating: averageRating,
        completed_walks: walkerWalks.length
      };
    });

    res.json(walkerSummaries);
  } catch (error) {
    console.error('Error fetching walker summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve walker summary data'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});



module.exports = app;