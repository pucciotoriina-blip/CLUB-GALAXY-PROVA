const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

// Struttura database
const defaultDB = {
  timbrature: [],
  vendite: [],
  magazzino: {
    medikit: 0,
    sole_bende: 0
  },
  dispensa: {
    bevande: 0,
    cibo: 0,
    alcolici: 0,
    gratta_vinci: 0
  },
  fatture: []
};

class Database {
  constructor() {
    this.ensureDB();
  }

  ensureDB() {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    }
  }

  read() {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    let changed = false;

    if (!data.magazzino) {
      data.magazzino = { medikit: 0, sole_bende: 0 };
      changed = true;
    }

    if (!data.dispensa) {
      data.dispensa = { bevande: 0, cibo: 0, alcolici: 0, gratta_vinci: 0 };
      changed = true;
    }

    if (data.dispensa && data.dispensa.alcolici === undefined) {
      data.dispensa.alcolici = 0;
      changed = true;
    }

    if (data.dispensa && data.dispensa.gratta_vinci === undefined) {
      data.dispensa.gratta_vinci = 0;
      changed = true;
    }

    if (!data.fatture) {
      data.fatture = [];
      changed = true;
    }

    if (changed) {
      this.write(data);
    }

    return data;
  }

  write(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }

  // Timbrature
  addTimbratura(userId, userName, userTag, azione) {
    const db = this.read();
    const timbratura = {
      id: Date.now().toString(),
      userId,
      userName,
      userTag,
      azione, // 'IN' o 'OUT'
      timestamp: new Date(),
      data: new Date().toLocaleDateString('it-IT')
    };
    db.timbrature.push(timbratura);
    this.write(db);
    return timbratura;
  }

  getTimbratureUtente(userId) {
    const db = this.read();
    return db.timbrature.filter(t => t.userId === userId);
  }

  getTimbratureGiorno(data) {
    const db = this.read();
    return db.timbrature.filter(t => t.data === data);
  }

  getAllTimbrature() {
    const db = this.read();
    return db.timbrature;
  }

  // Vendite
  addVendita(userId, userName, cosa, prezzo, convenzione, societa) {
    const db = this.read();
    const vendita = {
      id: Date.now().toString(),
      userId,
      userName,
      cosa,
      prezzo: parseFloat(prezzo),
      convenzione,
      societa,
      timestamp: new Date(),
      data: new Date().toLocaleDateString('it-IT')
    };
    db.vendite.push(vendita);
    this.write(db);
    return vendita;
  }

  getVenditeUtente(userId) {
    const db = this.read();
    return db.vendite.filter(v => v.userId === userId);
  }

  getTotaleVenditeUtente(userId) {
    const vendite = this.getVenditeUtente(userId);
    return vendite.reduce((total, v) => total + v.prezzo, 0);
  }

  // Magazzino
  aggiungiStock(prodotto, quantita) {
    const db = this.read();
    if (db.magazzino[prodotto] !== undefined) {
      db.magazzino[prodotto] += quantita;
      this.write(db);
      return db.magazzino[prodotto];
    }
    return null;
  }

  togliStock(prodotto, quantita) {
    const db = this.read();
    if (db.magazzino[prodotto] !== undefined) {
      db.magazzino[prodotto] = Math.max(0, db.magazzino[prodotto] - quantita);
      this.write(db);
      return db.magazzino[prodotto];
    }
    return null;
  }

  getStock(prodotto) {
    const db = this.read();
    return db.magazzino[prodotto] || 0;
  }

  getAllStock() {
    const db = this.read();
    return db.magazzino;
  }

  // Dispensa
  aggiungiStockDispensa(prodotto, quantita) {
    const db = this.read();
    if (db.dispensa[prodotto] !== undefined) {
      db.dispensa[prodotto] += quantita;
      this.write(db);
      return db.dispensa[prodotto];
    }
    return null;
  }

  togliStockDispensa(prodotto, quantita) {
    const db = this.read();
    if (db.dispensa[prodotto] !== undefined) {
      db.dispensa[prodotto] = Math.max(0, db.dispensa[prodotto] - quantita);
      this.write(db);
      return db.dispensa[prodotto];
    }
    return null;
  }

  getStockDispensa(prodotto) {
    const db = this.read();
    return db.dispensa[prodotto] || 0;
  }

  getAllStockDispensa() {
    const db = this.read();
    return db.dispensa;
  }

  // Fatture
  addFattura(userId, userName, vendita, prezzo) {
    const db = this.read();
    const fattura = {
      id: Date.now().toString(),
      userId,
      userName,
      vendita,
      prezzo: parseFloat(prezzo),
      timestamp: new Date(),
      data: new Date().toLocaleDateString('it-IT'),
      stato: 'ATTIVA' // ATTIVA, ANNULLATA
    };
    db.fatture.push(fattura);
    this.write(db);
    return fattura;
  }

  getFattura(id) {
    const db = this.read();
    return db.fatture.find(f => f.id === id);
  }

  updateFattura(id, updates) {
    const db = this.read();
    const index = db.fatture.findIndex(f => f.id === id);
    if (index !== -1) {
      db.fatture[index] = { ...db.fatture[index], ...updates };
      this.write(db);
      return db.fatture[index];
    }
    return null;
  }

  getFattureUtente(userId) {
    const db = this.read();
    return db.fatture.filter(f => f.userId === userId);
  }

  getTotaleFattureUtente(userId) {
    const fatture = this.getFattureUtente(userId);
    return fatture
      .filter(f => f.stato === 'ATTIVA')
      .reduce((total, f) => total + f.prezzo, 0);
  }

  getAllFatture() {
    const db = this.read();
    return db.fatture;
  }
}

module.exports = new Database();
