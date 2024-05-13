//Import des modules nécessaires 
const request = require("supertest")//Importe le module supertest, qui permet de simuler des requêtes HTTP
const app = require("./app")//Importe l'application Express à tester, probablement définie dans un fichier app.js.

//Description des tests avec describe 
describe('Express API', () =>{//Groupe les tests sous la description "Express API".
//Tests individuels avec it
  it('GET /alldemande --> liste de demande', ()=>{//Définit un test qui vérifie le comportement de le point final GET /alldemande.
    //On accede a une donnée protégé donc on a une erreur
    return request(app)
      .get('/alldemande')
      .expect('Content-Type',	'application/json; charset=utf-8')
      .expect(400)
      .then((response)=>{
        expect(response.body).toEqual(
            expect.objectContaining({
              error: expect.any(String),
            })
        
        )
      })
  })

  //Test pour la creation d'une demande
  it('POST /submit-demande --> liste de demande', ()=>{//Définit un test qui vérifie le comportement de le point final POST /submit-demande.
    //On accede a une donnée protégé donc on a une erreur
    return request(app)
      .post('/submit-demande').send({
        client : "Test",
        service: "Test"
      })
      //Assertions avec .expect 
      //Vérifie que le type de contenu retourné par l'API est JSON.
      .expect('Content-Type',	'application/json; charset=utf-8')
      //Vérifie que la réponse HTTP a le code de statut attendu (400 pour l'erreur, 200 pour le succès).
      .expect(200)
      //Assertions personnalisées avec then
      .then((response)=>{//Permet d'effectuer des assertions personnalisées sur la réponse de la requête.
        expect(response.body).toEqual(// Vérifie que le contenu de la réponse est conforme aux attentes.
            expect.objectContaining({
              date_creation: expect.any(String),
            })
        
        )
      })
  })
})