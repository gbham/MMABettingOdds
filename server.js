const express = require('express');
var app = express();
const expbs  = require('express-handlebars');
const handlebars = require('handlebars');
const path = require('path');
const waitUntil = require('wait-until');
const request = require('request');


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
                // hbs.helpers.Test(); //I believe in theory this should work. Not sure why it can't eventually recover, must be an underlying issue.
                
            }
           
        },

        CreateTable: function() { 

            var rowsToInsertHeadings = hbs.helpers.WhereToInsertEventHeadings();

            var rows = hbs.helpers.InputAPIDataIntoRows();       

            rows = hbs.helpers.ReverseOrderOfFightsPerEvent(rows, rowsToInsertHeadings);

            rows = hbs.helpers.AssignRowIDs(rows);

            var table = hbs.helpers.InsertEventHeadings(rows, rowsToInsertHeadings);    
            
            return table;
           
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


        WhereToInsertEventHeadings: function() {
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


        InputAPIDataIntoRows: function() {
            //**NOTE: Keep in mind that rows[0] is where the fighters names/odds begin. The heading is not included in this array

            global.homeOrAway = 0;
            var team = 0; 
            var rows = [];
            var fight;
                        
            var NoOfRows = hbs.helpers.GetNumberOfRowsToShow();        

            for (let i=0; i<NoOfRows; i++)  
            {
                if (i%2 == 0) {fight = i/2;} else {fight = (i-1)/2;}

                rows[i] = hbs.helpers.CreateRow(fight, team);                
                
                if (team == 0) {team = 1} else {team = 0};
            }

            return rows;
        },

        CreateRow: function(fight, team) {

            //The id's are applied later since I need to reverse the order of each event
            var row = "<tr id=>";              
            row += "<td>" + global.oddsData.data[fight].teams[team] + "</td>";

            for (let column=1; column<10; column++) 
            {                              
                row += "<td>" + hbs.helpers.LookupOdds(fight, column) + "</td>";                            
            }

            row += "</tr>";           

            return row;
        },



        //Any fights greater than 3 weeks away are not shown
        GetNumberOfRowsToShow: function() {

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


        LookupOdds: function(fight, column) { //, teams
           
            //Since the home and away fighters will be alternating between calling this function, I can determine which one is calling through this instead of sending 'teams' in as a paramter to the function
            if(global.homeOrAway == 1)
            {
                global.homeOrAway = 0
            }
            else
            {
                global.homeOrAway = 1
            }

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
        
            //Since the function knows what column you are in, it can find out what bookmakers odds should be returned
            for(let i = 0; i < global.oddsData.data[fight].sites.length; i++)
            {   
                if(global.oddsData.data[fight].sites[i].site_key == columnNumber[column])
                {                    
                    return global.oddsData.data[fight].sites[i].odds.h2h[homeOrAway];
                }
            } 
            
        },

        //The order of the data from the API needs reversed
        ReverseOrderOfFightsPerEvent: function(rows, rowsToInsertHeadings) {

            //May need an EventFour at some point
            var EventOne = [];
            var EventTwo = [];
            var EventThree = [];

            for(let i=0; i<rows.length; i++)
            {
                if(i<rowsToInsertHeadings[0])
                {
                    EventOne[i] = rows[i];
                }
                else if (i>=rowsToInsertHeadings[0] && i<rowsToInsertHeadings[1])
                {
                    EventTwo[i] = rows[i];
                }
                else if (i>=rowsToInsertHeadings[1] && i<rowsToInsertHeadings[2])
                {
                    EventThree[i] = rows[i];
                }
            }

            EventOne.reverse();
            EventTwo.reverse();
            EventThree.reverse();            
            
            for(let i=0; i<rows.length; i++)
            {
                if(i<EventOne.length)                
                {
                    rows[i] = EventOne[i];
                }
                else if (i<EventTwo.length)
                {
                    rows[i] = EventTwo[i];
                }
                else if (i<EventThree.length) 
                {
                    rows[i] = EventThree[i];
                }
            }

            return rows;

        },


        AssignRowIDs: function(rows)  {
            
            for(let i=0; i<rows.length; i++)
            {                
                rows[i] = rows[i].substring(0,7) + "row" + i + rows[i].substring(7)

            }

            return rows;

        },

        InsertEventHeadings: function(rows, rowsToInsertHeadings)  {
            //**NOTE: Keep in mind that rows[0] is where the fighters names/odds begin. The heading is not included in this count
                
                //Insert main header row
                let table ="<tr id=headerRow><th>Fight Card Title</th><th>Unibet</th><th>Ladbrokes</th><th>Betfred</th><th>Betfair</th><th>PaddyPower</th><th>Sport888</th><th>Matchbook</th><th>Marathon</th><th>NordicBet</th></tr>";
                    
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

