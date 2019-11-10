const express = require('express');
var app = express();
const expbs  = require('express-handlebars');
const handlebars = require('handlebars');
const path = require('path');
const waitUntil = require('wait-until');
const request = require('request');



// do {
//     try{
//         console.log("being ran");
//         request('https://api.the-odds-api.com/v3/odds?api_key=1420768311f2ce13ca7ead7ea31c214d&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                    
//             global.oddsData = body;
        
//             if (err) { return console.log("Request module to get API DATA failed:" + err); }                             
                        
//         });
//     }
//     catch(err)
//     {
//         console.log("INSIDE THE CATCH FOR API CALL")
//         request('https://api.the-odds-api.com/v3/odds?api_key=1420768311f2ce13ca7ead7ea31c214d&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                    
//             global.oddsData = body;
        
//             if (err) { return console.log("Request module to get API DATA failed:" + err); }                             
                        
//         });
//     }
    
// }
// while(global.oddsData!=undefined)




app.use(express.static('public'));



const hbs = expbs.create({
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views/layouts/'),

    //create custom helpers
    helpers: {
        
        
        Sleep: function()   {
            
            var waitTill = new Date(new Date().getTime() + 4 * 1000);            
            while(waitTill > new Date()){}

        },

        Test: function()   {
            console.log("API call made");
            
        
            try{     
                
                
                request('https://api.the-odds-api.com/v3/odds?api_key=41ca42613c3990833519f5b8a2b892e8&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                            
                    global.oddsData = body;
                    console.log("Just assinged global.oddsData");
                
                    if (err) { return console.log("Request module to get API DATA failed:" + err); }                             
                                
                });

               
              
            }
            catch(err)
            {
                console.log("ERROR - INSIDE THE CATCH FOR API CALL")
                                
                // hbs.helpers.Test();

                // request('https://api.the-odds-api.com/v3/odds?api_key=41ca42613c3990833519f5b8a2b892e8&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                            
                //     global.oddsData = body;
                //     console.log("Just assinged global.oddsData");
                
                //     if (err) { return console.log("Request module to get API DATA failed:" + err); }                             
                                
                // });
            }       
                
            

            

           
        },


       




        WaitUntilAPIDataIsReturned: function()   {            
         
        //     //var waitTill = new Date(new Date().getTime() + 3 * 1000);
        //    // while(global.oddsData==undefined || waitTill > new Date()){} //For some reason when I add in the "wait", the first part of the statement stops working?
                        
        //     do {   
        //         console.log("OUTSIDE: global.oddsData = " + global.oddsData);             
        //         if(global.oddsData!=undefined) 
        //         {    

        //             console.log("INSIDE: global.oddsData = " + global.oddsData);                     
        //             break;
                    
        //         } 

        //     } while (global.oddsData==undefined) //|| waitTill > new Date() WHEN THIS WAIT TILL IS USED, THE OTHER PART OF THE STATEMENT IS IGNORED




        },

        //Any fights greater than 3 weeks away are not shown
        GetNumberOfRowsToShow: function()   
        {
            for(let i = 0; i < global.oddsData.data.length; i++)    
            {  
                const now = Math.round(Date.now() / 1000);
                var timeToFight = global.oddsData.data[i].commence_time - now;
                var threeWeeks = "1814400";                            
                
                if(timeToFight > threeWeeks)
                {                    
                    return i*2;                    
                }                    
            }
        },

        WhereToInsertHeadings: function()
        {
            var counter = 0;
            var rowsToInsertHeadings = [];
            for(let i = 0; i < global.oddsData.data.length -1 ; i++)  
            {  
                //Unix/Epoch time
                var fightTimeA = global.oddsData.data[i].commence_time;
                var fightTimeB = global.oddsData.data[i+1].commence_time;
                var twelveHours = 43200;      
                
                //Since the API data is ordered by time if a fight is more than 12 hours away from the next one in the array, then they belong to differnt fight cards
                if(fightTimeB - fightTimeA > twelveHours)
                {
                //Why we need the "+2" above. For example, When i = 2, then we are actually at the 3rd data point of the oddsData.data[] array
                //This means we want (row[6]), the 7th row in the table, so we do i * 2 + 2 = row (e.g. 2 * 2 + 2 = 6) 
                rowsToInsertHeadings[counter] = i * 2 + 2;
                counter++;     

                }
            }

            return rowsToInsertHeadings;



        },




        CreateTable: function() { 

            console.log("inside CreateTable");                        
            
            var rows = hbs.helpers.CreateRows();
            var table = hbs.helpers.CreateTableFromRows(rows);    
            
            return table;           
        },
        
        CreateRows: function() {  
        //**NOTE: Keep in mind that rows[0] is where the fighters names/odds begin. The heading is not included in this count

            global.homeOrAway = 0;
            var rows = [];
            var fight;
            var team = 0; 
            var NoOfRows = hbs.helpers.GetNumberOfRowsToShow();             
            
            for (let i=0; i<NoOfRows; i++)  
            {
                if(i%2==0) 
                {
                    fight = i/2;
                }
                else 
                {
                    fight = (i-1)/2
                }
                                                                                  
                rows[i] = "<tr id=row" + i + ">";                
                rows[i] += "<td>" + global.oddsData.data[fight].teams[team] + "</td>";                
                for (let column=1; column<10; column++) 
                {                              
                    rows[i] += "<td>" + hbs.helpers.LookupOdds(fight, column) + "</td>";                            
                } 
                rows[i] += "</tr>";                

                if(team==0) {team=1} else {team=0};
            }
            
            return rows;  
    },


        CreateTableFromRows: function(rows) {
        //**NOTE: Keep in mind that rows[0] is where the fighters names/odds begin. The heading is not included in this count
            
            //Insert main header row
            let table ="<tr id=headerRow><th>Fight Card Title</th><th>Unibet</th><th>Ladbrokes</th><th>Betfred</th><th>Betfair</th><th>PaddyPower</th><th>Sport888</th><th>Matchbook</th><th>Marathon</th><th>NordicBet</th></tr>";
            
            var rowsToInsertHeadings = hbs.helpers.WhereToInsertHeadings(); 

            //Appending the rows to create the final table string            
            let counter = 0;
            for (let i=0; i<rows.length; i++) 
            {  
                if(i==rowsToInsertHeadings[counter])
                {   
                    table += "<tr id=FightCardHeading><td>UFC 222: SMITH VS SMITH</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>"
                    counter++;
                }                
                table += rows[i];
            }        

            return table;
        },

        
        LookupOdds: function(fight, column) { //, teams
                         
            var columnNumber = [
                "FILLER",
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
        
            //Since the function knows what column you are in, it can find out what bookies odds should be returned
            for(let i = 0; i < global.oddsData.data[fight].sites.length; i++)
            {   
                if(global.oddsData.data[fight].sites[i].site_key == columnNumber[column])
                {                    
                    return global.oddsData.data[fight].sites[i].odds.h2h[homeOrAway];
                }
            } 

            //Since the home and away fighters will be alternating between calling this function, I can determine which one is calling here instead of sending 'teams' in as a paramter.
            if(global.homeOrAway == 0)
            {
                global.homeOrAway = 1
            }
            else
            {
                global.homeOrAway = 0
            }

        },
        

        
        




        


    }
});



hbs.helpers.Test();




// view engine setup
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

 

app.get('/', (req, res) => {
    res.render('index.handlebars', { 
        title: 'Home Page',
        name: 'greg', 
        isCompleted: false,
        style: 'style.css',
                         
    });
});






app.listen(8080, () => {
  console.log('Server is starting at port ', 8080);
});

