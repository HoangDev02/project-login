const mongoose = require('mongoose')

const connect = async ()=> {
    try {
        await mongoose.connect(process.env.MONGODB);
        console.log("mongoose connected")
      } catch (error) {
        throw error
      }
  };
  mongoose.connection.on("disconnect", ()=> {
    console.log("mongoose disconnect")
})

module.exports = connect  