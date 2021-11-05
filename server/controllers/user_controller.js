require('dotenv').config()
const validator = require('validator')
const User = require('../models/user')


const signIn = async(req, res) => {

}

const signUp = async (req, res) => {
  const {email, password} = req.body.data
  let {name} = req.body.data

  if (!validator.isEmail(email)) {
      res.status(400).send({error:'Request Error: Invalid email format'})
      return
  }
  name = validator.escape(name)
  const user = await User.signUp(name, email, password)

  return res.status(200).send({
    data: {
        access_token: user.access_token,
        user: {
          name,
          email
        }
    }
  })
}
const getVaults = async (req, res) => {

}

const signOut = async(req, res) => {

}

module.exports =  { 
                    getVaults,
                    signIn,
                    signUp,
                    signOut
}
