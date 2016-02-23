var fs = require('fs');
var path = require('path');
var watch = require('node-watch');
var mkdirp = require('mkdirp');
var inboxDir = path.join(__dirname, 'inbox');
var outboxDir = path.join(__dirname, 'outbox');
var logFilePath = path.join(__dirname, 'outfile.txt');
var timers = {};

// This function fires with every inotify "change" event
// until a file is completely written.  Just now the node-watch
// module works
var handleIncomingFile = function( inFilePath ) {

   fs.stat( inFilePath, function(err, originalStats) {
      
      if(timers[ inFilePath ]) {
         clearTimeout( timers[ inFilePath ] );   
      }
      
      if(err) {
         console.error('init stat fail');
         console.error(err);
         console.log(originalStats);
         return;   
      }
      
      // Timer is needed for large files as they keep 
      // incrementing in size
      timers[ inFilePath ] = setTimeout(function() {
         
         fs.stat( inFilePath, function(err, newerStats) {
            
            if(err) {
               console.error('time stat fail');
               console.error(err);
               return;   
            }
            
            // Sizes, match file is complete
            if(newerStats.size == originalStats.size) {
               
               var outFilePath = path.join(outboxDir, path.basename(inFilePath) );
               
               mkdirp(outboxDir, function(err) {
                  
                  if(err) {
                     console.error('mkdir fail');
                     return console.error(err);
                  }

                  var fileReader = fs.createReadStream(inFilePath);
                  var fileWriter = fs.createWriteStream(outFilePath);
            
                  fileReader.on('error', function(err) {
                     console.error('fileread fail');
                     console.error(err);   
                  });
            
                  fileWriter.on('error', function(err) {
                     console.error('filewrite fail');
                     console.error(err);   
                  });
            
                  fileReader.on('close', function(err) {
                     fs.appendFile( logFilePath, inFilePath + ' ' + outFilePath + '\n', { flag  : 'a+' }, function(err) {
                        if(err) console.error(err);
                     });
                  });
                  
                  fileReader.pipe(fileWriter);
               });
            }
         });
         
      }, 500);
      
   });   
}

watch(inboxDir, { recursive : true, followSymLinks : true }, handleIncomingFile);  



