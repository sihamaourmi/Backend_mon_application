const mongoose=require('mongoose');

const demandeSchema = mongoose.Schema ({
    num_demande: {type:'Number'},
    indiceFabri: {type:'Number'},
    indiceAssemblage: {type:'Number'},
    client: {type:'String'},
    service: {type:'String'},
    num_ligne: {type:'Number'},
    nom_machine: {type:'String'},
    zone: {type:'String'},
    degre_urgence: {type:'String'},
    description: {type:'String'},
    date_creation:{type:'date'},
    date_prevue: {type:'date'},
    date_realisation: {type:'date'},
    statut: { type: 'String' },
    date_validation: { type: 'date' },
    image: { type: 'String' },
    imageAssemblage: { type: 'String' },
    
  
    
})
module.exports = mongoose.model('Demande',demandeSchema);

//contact.js:c'est l'enregistrement des donnes sur la base de donnes 