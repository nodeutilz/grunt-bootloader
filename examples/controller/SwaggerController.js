
module.exports = function(router){

  router.on({
    "url" : "/view/{fname}/{lname}",
    "type" : "json",
    "role" : ["ADMIN","USER"]
  },function(lname,fname){
    console.log(fname,lname);
    //this.response.write("helllo "+ fname + " " + lname);
    //console.log("this",this.view)
    return this.view("test.html",{ fname : fname,lname : lname});
  });

  router.on({
    "url" : "/json/template/{fname}/{lname}",
    "type" : "json"
  },function(lname,fname){
    console.log(fname,lname);
    //this.response.write("helllo "+ fname + " " + lname);
    //console.log("this",this.view)
    var oldFname = this.user.get("fname");
    this.user.set("fname",fname);
    return this.json("test.json",{ fname : fname,lname : lname, oldFname : oldFname});
  });

  router.on({
    "url" : "/json/direct/{fname}/{lname}",
    "type" : "json"
  },function(lname,fname){
    console.log(fname,lname);
    //this.response.write("helllo "+ fname + " " + lname);
    //console.log("this",this.view)
    var oldFname = this.user.get("fname");
    this.user.set("fname",fname);
    return this.json({ "fname" : fname, "lname" : lname, "oldFname" : oldFname || null});
  });

};