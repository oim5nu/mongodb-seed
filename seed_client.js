const faker = require('faker');
const MongoClient = require('mongodb').MongoClient;
//const assert = require('assert');
const _ = require('lodash');
const colors = require('colors');
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});

//const uri = "mongodb+srv://<user_name>:<password>@cluster0-23rda.mongodb.net/test?retryWrites=true&w=majority";
const url = process.env.MONGO_URL;
const dbName = process.env.MONGO_DBNAME;
const options = process.env.MONGO_OPTIONS;
const uri = `${url}/${dbName}?${options}`

console.log(uri.yellow.inverse);

const client = new MongoClient(uri, { 
  useNewUrlParser: true,
  useUnifiedTopology: true
});

(async () => {
  try {
    console.log('\nSeeding with Mongodb Client'.magenta.inverse);
    console.time('connection');
    await client.connect();
    console.timeEnd('connection');
    const db = client.db(dbName);

    const userCollection = db.collection("users");
    const jobCollection = db.collection("jobs");

    await Promise.all([userCollection.deleteMany({}), jobCollection.deleteMany({})])

    // Insert Users
    let users = [];
    for (let i=0; i< process.env.NUMBER_OF_USERS; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const createdAt = faker.date.recent();
      let newUser = {
        email: faker.internet.email(firstName, lastName),
        firstName,
        lastName,
        password: "password123",
        createdAt 
      };
      users.push(newUser);

      //console.log(newUser.email.green);
    }
    console.time('insert to users');
    await userCollection.insertMany(users);
    console.timeEnd('insert to users');
    // Insert Jobs
    let jobs = [];
    for (let i=0; i < process.env.NUMBER_OF_JOBS; i ++) {
      let newJob = {
        title: faker.lorem.words(7),
        body: faker.lorem.words(500),
        // lodash to pick a random subset
        owner: _.sample(users),
        // lodash to add random subset of the 
        usersAssociated: _.sampleSize(users, Math.round(Math.random() * process.env.NUMBER_OF_REFERENCING/*users.length*/)).map(
          user => user._id
        )
      };
      jobs.push(newJob);
      //console.log(newJob.title.magenta);
    }
    console.time('insert to jobs');
    await jobCollection.insertMany(jobs);
    console.timeEnd('insert to jobs');
    
    console.time('Connection Close');
    await client.close();
    console.timeEnd('Connection Close');

    console.log("Database seeded!".rainbow);
    process.exit();
  } catch(error) {
    console.log(`Database connection error: ${error}`.red);
  }
})();
