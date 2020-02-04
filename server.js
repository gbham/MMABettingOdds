const express = require('express');
var app = express();
const expbs  = require('express-handlebars');
const handlebars = require('handlebars');
const path = require('path');
const waitUntil = require('wait-until');
const request = require('request');

const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');


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

        CallAPI: function()   {
            console.log("API call made");           
        

            (async function SendRequest() {                
                try {
                    await request('https://api.the-odds-api.com/v3/odds?api_key=41ca42613c3990833519f5b8a2b892e8&sport=mma_mixed_martial_arts&region=uk', { json: true }, (err, res, body) => {
                            
                        global.oddsData = body;
                        console.log("Just assinged global.oddsData");
                    
                        if (err) { return console.log("Request module to get API DATA failed:" + err); }                             
                                    
                    });               
                  
                }                 
                catch(err)
                {
                    console.log("ERROR - INSIDE THE CATCH FOR API CALL")                                
                    
                    
                }
                 finally {
                  //await driver.quit();
                }
              })();



           
        },


        TestSelenium: function () {


            (async function example() {
                let driver = await new Builder().forBrowser('chrome').build();
                try {
                    //await driver.get('https://www.google.com/');
                  await driver.get('http://localhost:8080/');
                  //await console.log(driver.findElement(By.css('#row4 > td:nth-child(5)')).getText());
                  
                } finally {
                  await driver.quit();
                }
              })();




        },



        CreateTable: function() { 

            var rowsToInsertHeadings = hbs.helpers.GetWhereToInsertEventHeadings();

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

        
        //This function loops through the API data, that is ordered by time and checks for a gap of more than 12 hours between two fights
        //When a gap of 12 hours is found then I know those fights belong to different events and a heading needs to go in the current position
        GetWhereToInsertEventHeadings: function() {
            var counter = 0;
            var rowsToInsertHeadings = [];

            for(let i = 0; i < global.oddsData.data.length -1 ; i++)  
            {  
                //Unix/Epoch time
                var fightTimeA = global.oddsData.data[i].commence_time;
                var fightTimeB = global.oddsData.data[i+1].commence_time;
                var twelveHours = 43200;
                
                if(fightTimeB - fightTimeA > twelveHours)
                {
                    //Why we need the "+2". For example, When i = 2, then we are actually at the 3rd data point of the oddsData.data[] array
                    //This means we want (row[6]), so we do i * 2 + 2 = row (e.g. 2 * 2 + 2 = 6) 
                    rowsToInsertHeadings[counter] = i * 2 + 2;
                    counter++; 
                }
            }

            return rowsToInsertHeadings;
        },


        //This function determines how many rows to show and then creates the row
        InputAPIDataIntoRows: function() {
            //**NOTE: Keep in mind that rows[0] is where the fighters names/odds begin. The heading is not included in this array

            global.homeOrAway = 0;
            var team = 0; 
            var rows = [];
            var fightNumber;
                        
            var NoOfRows = hbs.helpers.GetNumberOfRowsToShow();        


            for (let i=0; i<NoOfRows; i++)  
            {   
                //I can divide an even row by 2 to get the corresponding position in the API data array then I just alternate between fighter A and Fighter B with 'team'          
                if (i%2 == 0) {fightNumber = i/2;} else {fightNumber = (i-1)/2;}

                rows[i] = hbs.helpers.CreateRow(fightNumber, team);                
                
                if (team == 0) {team = 1} else {team = 0};
            }

            


            return rows;
        },

        //Creates a row, looks up the relevant name for the fighter provided then lookups all the corresponding odds 
        CreateRow: function(fightNumber, team) {

            //The id's are applied later since I need to reverse the order of each event
            var row = "<tr id=>";

                row += "<td>" + global.oddsData.data[fightNumber].teams[team] + "</td>";
                for (let column=1; column<10; column++) 
                {                              
                    row += "<td>" + hbs.helpers.LookupOdds(fightNumber, column) + "</td>";                            
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

                //Once I find a fight in the API data array that is more than 3 weeks away I times that index by 2 and send back the number of rows
                if(timeToFight > threeWeeks)
                {   
                    return i * 2;                    
                }                    
            }
        },


        //This function looksup the value of the corresponding odds for a certain fighter and bookmaker
        //Since each bookmaker is a column, I 
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

            var siteKey = [
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
        
            //Since the function knows what column you are in, it can find out what bookmakers odds should be returned by looping until it matches with the desired 'site_key'
            for(let i = 0; i < global.oddsData.data[fight].sites.length; i++)
            {   
                if(global.oddsData.data[fight].sites[i].site_key == siteKey[column])
                {                    
                    return global.oddsData.data[fight].sites[i].odds.h2h[homeOrAway];
                }
            } 

        },

        //The order of the data from the API needs reversed due to the way it is stored (EDIT: This doesnt appear to work after the first event)
        ReverseOrderOfFightsPerEvent: function(rows, rowsToInsertHeadings) {

            var events = hbs.helpers.ExtractIndividualEvents(rows, rowsToInsertHeadings);
            
            var eventOne = events[0];
            var eventTwo = events[1];
            var eventThree = events[2];   
       
            eventOne.reverse();
            eventTwo.reverse();
            eventThree.reverse();

            rows = hbs.helpers.CombineOrderedEvents(rows, eventOne, eventTwo, eventThree);         

            return rows;
        },

        ExtractIndividualEvents: function(rows, rowsToInsertHeadings)  {

            //May need an EventFour at some point
            var eventOne = [];
            var eventTwo = [];
            var eventThree = [];

            let eventTwoCounter = 0;
            let eventThreeCounter = 0;

            for(let i=0; i<rows.length; i++)
            {
                if(i < rowsToInsertHeadings[0])
                {
                    eventOne[i] = rows[i];
                }
                else if (i >= rowsToInsertHeadings[0] && i < rowsToInsertHeadings[1])
                {
                    eventTwo[eventTwoCounter] = rows[i];
                    eventTwoCounter++;
                }
                else if (i >= rowsToInsertHeadings[1] && i < rowsToInsertHeadings[2])
                {
                    eventThree[eventThreeCounter] = rows[i];
                    eventThreeCounter++;
                }
            }

            var events = [eventOne, eventTwo, eventThree];

            return events;


        },

        CombineOrderedEvents: function(rows, eventOne, eventTwo, eventThree)  {

            let eventTwoCounter = 0;
            let eventThreeCounter = 0;
            
            for(let i=0; i<rows.length; i++)
            {
                if(i < eventOne.length)                
                {
                    rows[i] = eventOne[i];
                }
                else if (i < eventOne.length + eventTwo.length)     
                {
                    rows[i] = eventTwo[eventTwoCounter];
                    eventTwoCounter++;
                }
                else if (i < eventOne.length + eventTwo.length + eventThree.length) 
                {
                    rows[i] = eventThree[eventThreeCounter];
                    eventThreeCounter++;
                }
            }

            return rows;
        },
     
        //The rows are now in the correct order (hopefully). Since I know every row starts with "<tr id=" I can now add in the appropiate row number with substring 
        AssignRowIDs: function(rows)  {
            
            for(let i=0; i < rows.length; i++)
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




hbs.helpers.CallAPI();
hbs.helpers.TestSelenium();


// view engine setup
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
 

app.get('/', (req, res) => {
    res.render('index.handlebars', { 
        title: 'Home Page',
        style: 'style.css',
                         
    });
});



app.listen(8080, () => {
  console.log('Server is starting at port ', 8080);
});

