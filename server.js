const express = require('express');
var app = express();
const expbs  = require('express-handlebars');
const handlebars = require('handlebars');
const path = require('path');
const fetch = require("node-fetch");
const waitUntil = require('wait-until');
const request = require('request');


request('https://api.the-odds-api.com/v3/odds?api_key=1420768311f2ce13ca7ead7ea31c214d&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                    
    global.oddsData = body;

    if (err) { return console.log(err); } 
                        
                    
});



app.use(express.static('public'));



const hbs = expbs.create({
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views/layouts/'),

    //create custom helpers
    helpers: {
        
        // CallAPI: function() {
        //     async function getOdds () {
        //         return new Promise(function(resolve, reject) {   
        //             //METHOD 1 part a:     
        //             // let response = await fetch("https://api.the-odds-api.com/v3/odds?api_key=1420768311f2ce13ca7ead7ea31c214d&sport=mma_mixed_martial_arts&region=uk", {                        
        //             // });                    
        //             // let APIData = await response.json(); //extract JSON from the http response         
                                        
        //             // return APIData;



        //             // request('https://api.the-odds-api.com/v3/odds?api_key=1420768311f2ce13ca7ead7ea31c214d&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                    
        //             // global.APIData = body;

        //             // if (err) { return console.log(err); 
                        
                    
        //             // }

                               
        //             resolve(body);

        //             });
        //         })
        //     }           
                                        
        //     //METHOD 1 part b:
        //     // getOdds()
        //     // .then(APIData => hbs.helpers.CreateTableRows(APIData))       //getSetOddsData(APIData)                
        //     // .catch(reason => console.log("CATCH: " + reason.message))

            

        //     async function test() {
        //         global.testOddsData = await getOdds();                
                  
        //         //I will add the oddsData in as a parameter in due time but right now I need to just return basic <tr><th> etc etc for proof of concept
        //         return hbs.helpers.CreateTableRows(); //global.testOddsData

        //     }

        //     //This method isn't working atm, I think because this gets returned straight away since its not an async function. Unsure if there is an easy work around I am
        //     //overlooking or if what I am doing is even possible
        //     return test();
            

            
        // },

        Sleep: function()   {
            
            var waitTill = new Date(new Date().getTime() + 5 * 1000);
            while(waitTill > new Date()){}



        },

        WaitUntilAPIDataIsReturned: function()   {
            
            waitUntil()
                .interval(100)
                .times(100)
                .condition(function() {
                    return (global.oddsData!=undefined ? true : false);
                })
                .done(function(result) {
                    if (result==true)
                    {                        
                        hbs.helpers.CreateTableRows()
                    }
                    else
                    {                        
                        console.log("ERROR: API DATA is undefined")
                    }
                    
                });

        },



        CreateTableRows: function() { //oddsData

            // var waitTill = new Date(new Date().getTime() + 5 * 1000);
            // while(waitTill > new Date()){}

            // var oddsData = global.oddsData;
           

                // try
                // {   
                //     if(global.oddsData!=undefined) //or null
                //     {

                //     }
                //     //console.log(global.oddsData.data[0].teams[0])

                // }
                // catch(err)
                // {
                //     console.log("CATCH: " + err);
                // }









            
     
                 
            var rows = [];            
            var teams = 0;
            

            //Adding rows and the cells within
            //Keep in mind that rows[0] is where the fighters names begin. The heading is not included in this count
            for (let i=0; i<24; i++)           //global.oddsData.length
            {  

                if(i%2==0)          //could just make the for loop increment 2 at a time for the same end result I think
                {  

                    //*********
                    //Fighter A
                    //*********
                    rows[i] = " ";              
                    rows[i] += "<tr id=row" + i + ">";  
                    rows[i] += "<td>" + global.oddsData.data[i/2].teams[0] + "</td>";                
                    for (let x=1; x<10; x++) 
                    {                              
                        rows[i] += "<td>" + hbs.helpers.Lookup(i/2, x, 0) + "</td>";
                        // rows[i] +=  
                        // rows[i] += "</td>";         
                    }
                    rows[i] += "</tr>";




                    //*********
                    //Fighter B
                    //*********
                    rows[i+1] = " ";              
                    rows[i+1] += "<tr id=row" + i + ">";
                    rows[i+1] += "<td>" + global.oddsData.data[i/2].teams[1] + "</td>";                
                    for (let x=1; x<10; x++) 
                    {
                              
                        rows[i+1] += "<td>" + hbs.helpers.Lookup(i/2, x, 1) + "</td>";    //add in something like $("<td> {hbs.helpers.Lookup(i, x, 1)} </td>")

                        // rows[i+1] += hbs.helpers.Lookup(i, x, 1);  
                        // rows[i+1] += "</td>";                    
                                                    
                    }  
                    rows[i+1] += "</tr>";



                }

                



                    


                
            }   
            

                


            //Appending the desired rows to the final output that will create the table
            let output =" ";
            for (let i=0; i<rows.length; i++) 
            {   
                output += rows[i];
            }

            return output;

           
        },
        
       
        
        Lookup: function(fight, column, teams) {

                           
            var columnNumber = [
                "FILL",
                "unibet",
                "ladbrokes",
                "betfred",
                "betfair",
                "paddypower",
                "sport888",
                "matchbook",
                "marathonbet",
                "nordicbet"                
            ]
        
            for(let i = 0; i < global.oddsData.data[fight].sites.length; i++)
            {   
                if(global.oddsData.data[fight].sites[i].site_key == columnNumber[column])
                {                    
                    return global.oddsData.data[fight].sites[i].odds.h2h[teams];
                }
                

            }           

            
        },
        

        
        




        


    }
});


// view engine setup
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

 

app.get('/', (req, res) => {
    res.render('index.handlebars', { 
        title: 'Home Page', 
        name: 'greg',
        isCompleted: false,
        style: 'style.css',
        columnNumber: [
            "unibet",
            "ladbrokes",
            "betfred",
            "betfair"
        ],                 
    });
});






app.listen(8080, () => {
  console.log('Server is starting at port ', 8080);
});