db = db.getSiblingDB('scaler_community');

db.createCollection('forums');
db.createCollection('threads');
db.createCollection('comments');

db.forums.insertMany([
    {
        title: "General Discussion",
        description: "Discuss anything related to learning",
        created_at: new Date()
    },
    {
        title: "API Security",
        description: "Share API security tips and tricks",
        created_at: new Date()
    }
]);

db.threads.insertMany([
    {
        forum_id: 1,
        user_id: 3,
        title: "How to get started with API testing?",
        content: "I'm new to API security testing. Any tips?",
        created_at: new Date()
    }
]);

db.comments.insertMany([
    {
        thread_id: "1",
        user_id: 2,
        content: "Start with OWASP API Top 10!",
        created_at: new Date()
    }
]);
