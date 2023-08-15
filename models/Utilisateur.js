const mongoose=require('mongoose');

const utilisateurSchema = mongoose.Schema ({
    nom: {type:'String',required:true},
    prenom: {type:'String'},
    email: {type:'String',required:true, unique: true},
    service: {type:'String'},
    password: {type:'String'},
    imagename: { type: 'String' },
    admin: {type: 'Boolean', default: false}
   
})
module.exports = mongoose.model('Utilisateur',utilisateurSchema);
