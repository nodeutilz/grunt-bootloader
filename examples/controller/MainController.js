
module.exports = function(router){

  router.on({
    "url" : "/view/{fname}/{lname}",
    "type" : "json"
  },function(lname,fname){
    console.log(fname,lname);
    //this.response.write("helllo "+ fname + " " + lname);
    //console.log("this",this.view)
    return this.view("test.html",{ fname : fname,lname : lname});
  });

  router.on({
    "url" : "/json/{fname}/{lname}",
    "type" : "json"
  },function(lname,fname){
    console.log(fname,lname);
    //this.response.write("helllo "+ fname + " " + lname);
    //console.log("this",this.view)
    return this.json("test.json",{ fname : fname,lname : lname});
  });

};