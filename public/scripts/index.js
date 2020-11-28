const {
  firebase, db, timediff, normstn, patch,
  main, section, div, h2, span, strong
} = window

const login = document.getElementById('login')
const welcome = document.getElementById('welcome')
const page = document.querySelector('.page.-home')

const state = {
  user: null,
  stations: [],
  messages: []
}

;(async function main () {
  let recents = window.localStorage.getItem('recents')
  recents = recents ? recents.split(',') : []

  for (const recent of recents) {
    const [id, route, name, before, after] = recent.split('-')
    state.stations.push({ id, route, name, before, after })
  }

  render(state)

  const col = await db.collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(3)
    .get()
  for (const doc of col.docs) {
    state.messages.push(doc.data())
  }
  render(state)
})()

// login/logout button
login.onclick = async function () {
  const signin = firebase.auth().currentUser
  if (signin) {
    welcome.innerText = ''
    await firebase.auth().signOut()
    window.location.href = 'index.html'
  } else {
    window.location.href = 'login.html'
  }
}

firebase.auth().onAuthStateChanged(user => {
  // if user isn't logged in, we don't need to do anything extra
  if (!user) return

  // set button text
  login.innerText = 'Logout'

  db.collection('users').doc(user.uid).get().then(users => {
    const name = users.data().name.split(' ')
    welcome.innerText = 'Hi, ' + name[0] + '!'

    // // Saved Station button
    // saved.onclick = _ => {
    //   const savedstations = users.data().saves
    //   patch(stationWrap, div({
    //     id: 'station'
    //   }, savedstations.map(renderRecent)))
    // }
  })
})

function render ({ user, stations, messages }) {
  patch(page, main({ class: 'page -home' }, [
    section({ class: 'section -stations' }, [
      h2({ class: 'section-title' },
        (user ? '' : 'Recent ') + 'Stations'),
      stations.length
        ? div({ class: 'section-options' }, stations.map(renderStation))
        : span({ class: 'section-notice' },
          'When you view a station\'s info, it will appear here.')
    ]),
    section({ class: 'section -messages' }, [
      h2({ class: 'section-title' }, 'Recent Messages'),
      messages.length
        ? div({ class: 'section-options' }, messages.map(renderMessage))
        : span({ class: 'section-notice' },
          'No recent user activity!')
    ])
  ]))
}

function renderStation (station) {
  const [on, at] = normstn(station.name)
  function onclick () {

  }
  return div({ class: 'option', onclick }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'option-text' }, on),
      span({ class: 'option-subtext' },
        [station.route, ' ‧ ', station.id, ' · on ', strong(at)])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}

function renderMessage (message) {
  const now = Date.now()
  const ago = timediff(message.timestamp, now)
  return div({ class: 'option -message' }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'option-text' }, `"${message.content}"`),
      span({ class: 'option-subtext' },
        ['from ', strong(message.username), ' at ', strong(message.route)])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-iconlabel' }, ago),
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}
