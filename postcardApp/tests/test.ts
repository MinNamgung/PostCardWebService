const request = require('supertest')
const app = require('../server')

describe('POST /register', () => {
    it('valid input | unique', done => {
        request(app)
        .post('/register')
        .send({
            firstname: 'Test',
            lastname: 'Test',
            email: 'test@test.com',
            username: 'test',
            password: 'test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(200, {'success':true,'message':"Registration successful"}, done)
    })
    it('valid input | username exists', done => {
        request(app)
        .post('/register')
        .send({
            firstname: 'Test',
            lastname: 'Test',
            email: 'test@test.com',
            username: 'test',
            password: 'test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(200, {'success':false,'message':"Username already exists"}, done)
    })
    it('invalid input', done => {
        request(app)
        .post('/register')
        .send({
            firstname: 'Test',
            lastname: 'Test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(400, done)
    })
})

describe('POST /login', ()=>{
    it('valid input | correct password', done => {
        request(app)
        .post('/login')
        .send({
            username: 'test',
            password: 'test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(200, {'success':true, 'message':"Login Sucessful"}, done)
    })
    it('valid input | incorrect password', done => {
        request(app)
        .post('/login')
        .send({
            username: 'test',
            password: 'test1'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(200, {'success':false, 'message':"Username or Password is incorrect"}, done)
    })
    it('valid input | incorrect username', done => {
        request(app)
        .post('/login')
        .send({
            username: 'test1',
            password: 'test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(200, {'success':false, 'message':"Username or Password is incorrect"}, done)
    })
    it('invalid input', done => {
        request(app)
        .post('/login')
        .send({
            username: 'test'
        })
        .set('Content-Type','application/x-www-form-urlencoded')
        .expect(400, done)
    })
})