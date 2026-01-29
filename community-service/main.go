package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var (
    client *mongo.Client
    db     *mongo.Database
)

type Forum struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Title       string             `json:"title" bson:"title"`
    Description string             `json:"description" bson:"description"`
    CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
}

type Thread struct {
    ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    ForumID   int                `json:"forum_id" bson:"forum_id"`
    UserID    int                `json:"user_id" bson:"user_id"`
    Title     string             `json:"title" bson:"title"`
    Content   string             `json:"content" bson:"content"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

type Comment struct {
    ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    ThreadID  string             `json:"thread_id" bson:"thread_id"`
    UserID    int                `json:"user_id" bson:"user_id"`
    Content   string             `json:"content" bson:"content"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

func main() {
    mongoURI := os.Getenv("MONGO_URI")
    if mongoURI == "" {
        mongoURI = "mongodb://scaler_admin:VulnerablePassword123!@mongodb:27017/scaler_community?authSource=admin"
    }

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var err error
    client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
    if err != nil {
        log.Fatal(err)
    }

    db = client.Database("scaler_community")

    router := gin.Default()
    
    router.Use(cors.New(cors.Config{
        AllowAllOrigins: true,
        AllowMethods:    []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:    []string{"*"},
    }))

    router.GET("/health", healthCheck)
    router.GET("/api/v1/forums", getForums)
    router.POST("/api/v1/forums", createForum)
    router.POST("/api/v1/forums/:forum_id/threads", createThread)
    router.GET("/api/v1/threads/:thread_id/comments", getComments)

    log.Println("Community Service running on port 8083")
    router.Run(":8083")
}

func healthCheck(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"status": "OK"})
}

func getForums(c *gin.Context) {
    collection := db.Collection("forums")
    cursor, err := collection.Find(context.Background(), bson.M{})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer cursor.Close(context.Background())

    var forums []Forum
    if err = cursor.All(context.Background(), &forums); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, forums)
}

func createForum(c *gin.Context) {
    var forum Forum
    if err := c.ShouldBindJSON(&forum); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    forum.CreatedAt = time.Now()

    collection := db.Collection("forums")
    result, err := collection.InsertOne(context.Background(), forum)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    forum.ID = result.InsertedID.(primitive.ObjectID)
    c.JSON(http.StatusCreated, forum)
}

func createThread(c *gin.Context) {
    var thread Thread
    if err := c.ShouldBindJSON(&thread); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    thread.CreatedAt = time.Now()

    collection := db.Collection("threads")
    result, err := collection.InsertOne(context.Background(), thread)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    thread.ID = result.InsertedID.(primitive.ObjectID)
    c.JSON(http.StatusCreated, thread)
}

func getComments(c *gin.Context) {
    threadID := c.Param("thread_id")
    
    collection := db.Collection("comments")
    cursor, err := collection.Find(context.Background(), bson.M{"thread_id": threadID})
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer cursor.Close(context.Background())

    var comments []Comment
    if err = cursor.All(context.Background(), &comments); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, comments)
}
