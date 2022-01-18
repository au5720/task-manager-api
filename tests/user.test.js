const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {  userOneId, userOne, setupDatabase} = require('./fixtures/db')



beforeEach(setupDatabase)

test('Should sign up a new User', async () => {
  const response = await request(app).post('/users').send({
    name: 'mike',
    email: 'mike@home.com',
    password: 'sjasdasddsfdasd'
  }).expect(201)

  // Assert that the database was changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'mike',
      email: 'mike@home.com',
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('sjasdasddsfdasd')
})

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)

  const user = await User.findById(userOneId)
  expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login non-existing user', async () => {
  await request(app).post('/users/login').send({
    email: 'not a real user',
    password: 'Bla bla'
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for authorized user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)

  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

test('Should NOT delete account when un-authorized user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatar image', async () => {
  const response = await request(app)
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .attach('avatar','tests/fixtures/profile-pic.jpg')
      .expect(200)
  
  const user = await User.findById(userOneId)
  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user field', async () => {
  const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        name: "bart"
      })
      .expect(200)
  const user = await User.findById(userOneId)
  expect(user.name).toBe('bart')
})

test('Should not update an invalid user field', async () => {
  const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        monkey: "bart"
      })
      .expect(400)
})


//
// User Test Ideas
//
// Should not signup user with invalid name/email/password
// Should not update user if unauthenticated
// Should not update user with invalid name/email/password
// Should not delete user if unauthenticated
