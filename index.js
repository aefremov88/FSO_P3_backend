require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))

app.use(express.json())

app.use(morgan(function (tokens, req, res) {
    const body = req.body
    const entry = body ? JSON.stringify(body) : null
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    entry
  ].join(' ')
}))


// ===GET=========================================================

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(result => {
      if (result) {
        response.json(result)
      } else {response.status(404).end()}
    })
    .catch(error => next(error))
})

app.get('/info', async (request, response) => {
  Person.find({})
  .then(result => 
    response.send(
      `<p>Phonebook has info for ${result.length} people</p>
      <p>${Date(Date.now())}</p>`
    )
  )
})

// ===PUT=========================================================

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  Person.findById(request.params.id)
    .then(person => {
      if (!person) {
        return response.status(404).end()
      }

      person.number = number

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson)
      })
    })
    .catch(error => next(error))
})

// ===DELETE======================================================

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

// ===POST========================================================

app.post('/api/persons', async (request, response, next) => {
  const body = request.body

  if (!body.name) {
    response.status(400).json({ 
    error: 'name is missing'});
    return;
  }

  if (!body.number) {
    response.status(400).json({ 
    error: 'number is missing'});
    return;
  }
  
  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save()
    .then(savedNote => {
      response.json(savedNote)
    })
    .catch(error => next(error))
})

// ===UNKNOWN URL FALLBACK=========================================

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

// ===ERROR HANDLER================================================

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  } 

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)


// ===LISTENNING PIPELINE LAUNCH==================================

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
