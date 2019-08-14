const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let db = admin.firestore();

const typeDefs = gql`
  type Personaje {
    name: String
    status: String
    species: String
    gender: String
    url: String


  }

  type Query {
    personajes: [Personaje]
    personaje(id: ID!): Personaje
  }
`;

const resolvers = {
  Query: {
    personajes: async () => {
      let personajes = [];
      try {
        await db
          .collection("character")
          .get()
          .then(function(querySnapshot) {
            if (querySnapshot) {
              querySnapshot.forEach(function(doc) {
                personajes.push(doc.data());
              });
            } else {
              console.log("Do Not Exist In DB");
            }
          });
      } catch (error) {
        console.log(error);
      }
      return personajes;
    },
    personaje: async (parent, args) => {
      const { id } = args;
      let personaje;
      try {
        await db
          .collection("character")
          .doc(id)
          .get()
          .then(function(doc) {
            if (!doc.exists) {
              console.log("No such document!");
            } else {
              personaje = doc.data();
            }
          })
          .catch(err => {
            console.log("Error getting document", err);
          });
        return personaje;
      } catch (error) {
        console.log(error);
      }
    }
  }
};

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
exports.graphql = functions.https.onRequest(app);
