const mongooes = require('mongoose');

const refreshTokens = mongooes.Schema(
    {
       
        accessToken: {
            type: String,
            required: true,
          },
        refreshToken: {
            type: String,
            required: true,
        },
          token: {
            type: String,
        }, 
    }
)
module.exports = mongooes.model("refreshTokens", refreshTokens)