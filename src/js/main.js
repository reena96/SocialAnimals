"use strict";

/* Get or create the application global variable */
var App = App || {};
var gps_data = {};
/* IIFE to initialize the main entry of the application*/
var sheep1;
var sheep2;
var lineArr1 = [];
var lineArr2 = [];
var count = 0;
var remove_path = [];
var chart1;
var chart2;
var path_svgContainer;
var path_rectangle;
var g;
var x, y, xAxis, yAxis, gX, gY, line;
(function() {

  // setup the pointer to the scope 'this' variable
  var self = this;
  // Defining data

  var loader = new THREE.FileLoader();
  var lat = {};
  var long = {};
  var timestamp = {};
  var gps_data = [];
  var i = 0;


  //load a text file and output the result to the console
  /* Entry point of the application */
  App.start = function() {
    // create a new scene
    App.scene = new Scene({
      container: "scene"
    });
    var p_width = d3.select('#path').node().clientWidth;
    path_svgContainer = d3.select("#path").append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
    g = path_svgContainer.append("g");
    path_rectangle = g
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", p_width)
      .attr("height", 310)
      .style("fill", "#D3D3D3")
      .attr("pointer-events", "all")
      .call(d3.zoom()
        .scaleExtent([1, 12])
        .on("zoom", zoom));

    x = d3.scaleLinear()
      .domain([0, 0.5])
      .range([0, p_width]);
    y = d3.scaleLinear()
      .domain([36.8, 37])
      .range([310, 0]);

    xAxis = d3.axisBottom(x);
    yAxis = d3.axisLeft(y);

    gX = g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + 310 + ")")
      .call(xAxis);
    gY = g.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis)



    // initialize the FIELD system

    var sheepSystem1 = new SheepSystem();
    sheepSystem1.initialize("2");
    sheep1 = sheepSystem1.getSheepSystem();
    sleep(100).then(() => {
      var sheepSystem2 = new SheepSystem();
      sheepSystem2.initialize("3");
      sheep2 = sheepSystem2.getSheepSystem();


      sheep1.scale.set(0.000625, 0.000625, 0.000625);
      sheep2.scale.set(0.000625, 0.000625, 0.000625);


      App.scene.addObject(sheep1);
      App.scene.addObject(sheep2);
      //Ground
      var ground_material = Physijs.createMaterial(
        new THREE.MeshStandardMaterial({
          color: "#ffffff"
        }), 0, .9 // low restitution
      );
      ground_material.side = THREE.DoubleSide;
      ground_material.transparent = true;
      // Ground
      var ground = new Physijs.BoxMesh(new THREE.BoxGeometry(40, 0, 40), ground_material, 0 // mass
      );
      ground.position.set(-0.5, -0.5, -0.5);

      ground.receiveShadow = true;
      App.scene.addObject(ground);
      App.scene.render();
      define_data();
      //console.log();
      var animal_select = document.getElementById("selectAnimal")
      animal_select.addEventListener("click", function() {
        console.log("Animals Select Input");
        var startTimeInput = document.getElementById("StartTime");
        count = startTimeInput.value - 1534395958;
        path_svgContainer.selectAll("circle").remove();
        sheep1.position.set(0, 0, 0);
        sheep2.position.set(0, 0, 0);
        define_data();
        //count = 0;
      });


      var startTimeInput = document.getElementById("StartTime");
      startTimeInput.oninput = function() {
        path_svgContainer.selectAll("circle").remove();
        console.log("Start Time Slider");
        console.log(startTimeInput.value);
        count = startTimeInput.value - 1534395958;
        sheep1.position.set(0, 0, 0);
        sheep2.position.set(0, 0, 0);

        define_data();
      }

    })
  };

})();
var count = 0;
var dataset1 = [];
var dataset2 = [];

var sampledData1;

function define_data() {
  path_svgContainer.selectAll("circle").remove();
  lineArr1 = [];
  lineArr2 = [];


  //console.log("define_data");
  if (document.getElementById("both").selected == true) {
    d3.queue()
      .defer(d3.csv, "data/mergedc2.csv")
      .defer(d3.csv, "data/mergedc3.csv")
      .await(analyzeboth);

    function analyzeboth(error, data1, data2) {
      //console.log(data1);
      if (error) {
        console.log(error);
      }

      // Sampling Data
      var slider = document.getElementById("sampleRate");
      var output = document.getElementById("rate");
      output.innerHTML = slider.value;
      //console.log(output.innerHTML);

      slider.oninput = function() {
        console.log("Sample Rate Slider");
        output.innerHTML = this.value;
        var startTimeInput = document.getElementById("StartTime");

        count = startTimeInput.value - 1534395958;
        console.log(count);

        console.log("Slider Value now");

        var sliderVal = parseInt(this.value);
        count = 0;
        path_svgContainer.selectAll("circle").remove();
        d3.select("svg").remove();
        var sampledData1 = sampleData(data1, sliderVal);
        var sampledData2 = sampleData(data2, sliderVal);
        drawLineGraphAcc(sampledData1, sampledData2, 1);
        console.log("Here1");
        removePathsFromScene();
        remove_path = [];
        moveSheep(sampledData1, sampledData2, sliderVal, 1);
      }
      drawLineGraphAcc(data1, data2, 2);
      //drawLineGraphAcc(data2,2);
      sheep1.visible = true;
      sheep2.visible = true;
      console.log("Here2");
      removePathsFromScene();
      remove_path = [];
      moveSheep(data1, data2, 5, 1);
    }
  } else {
    if (document.getElementById("sheep2").selected == true) {
      console.log("sheep2");
      d3.queue()
        .defer(d3.csv, "data/mergedc2.csv")
        .await(analyze);
    } else {
      d3.queue()
        .defer(d3.csv, "data/mergedc3.csv")
        .await(analyze);
    }

    function analyze(error, data1) {
      if (error) {
        console.log(error);
      }

      // Sampling Data
      var slider = document.getElementById("sampleRate");
      var output = document.getElementById("rate");
      output.innerHTML = slider.value;
      //console.log(output.innerHTML);

      slider.oninput = function() {
        output.innerHTML = this.value;

        console.log("Slider Value now");
        var sliderVal = parseInt(this.value);
        //count = 0;
        var sampledData1 = sampleData(data1, sliderVal);
        drawLineGraphAcc(sampledData1, null, 1);
        removePathsFromScene();
        remove_path = [];
        moveSheepAlone(sampledData1, sliderVal, 1);

      }
      drawLineGraphAcc(data1, null, 1);
      removePathsFromScene();
      remove_path = [];
      moveSheepAlone(data1, 5, 1);
    }
  }
}

function sampleData(arr, n) {
  var result = [];
  var object;
  for (var i = 0; i < arr.length; i = i + n) {
    console.log(arr.length);
    object = {
      TIMESTAMP: arr[i].TIME,
      Latitude: arr[i].Latitude,
      Longitude: arr[i].Longitude,
      bracelet_ACC_X: arr[i].bracelet_ACC_X,
      bracelet_ACC_Y: arr[i].bracelet_ACC_Y,
      bracelet_ACC_Z: arr[i].bracelet_ACC_Z,
      bracelet_GYRO_X: arr[i].bracelet_GYRO_X,
      bracelet_GYRO_Y: arr[i].bracelet_GYRO_Y,
      bracelet_GYRO_Z: arr[i].bracelet_GYRO_Z,
      collar_ACC_X: arr[i].collar_ACC_X,
      collar_ACC_Y: arr[i].collar_ACC_Y,
      collar_ACC_Z: arr[i].collar_ACC_Z,
      collar_GYRO_X: arr[i].collar_GYRO_X,
      collar_GYRO_Y: arr[i].collar_GYRO_Y,
      collar_GYRO_Z: arr[i].collar_GYRO_Z,
      collar_MAG_X: arr[i].collar_MAG_X,
      collar_MAG_Y: arr[i].collar_MAG_Y,
      collar_MAG_Z: arr[i].collar_MAG_Z,
    };
    result.push(object);
  }
  return result
}

function sampleDataAcc(arr, n) {

  var result = [];
  var object;
  for (var i = 0; i < arr.length; i = i + n) {
    console.log(arr.length);
    object = {
      TIMESTAMP: arr[i].TIMESTAMP,
      ACC_X: arr[i].ACC_X,
      ACC_Y: arr[i].ACC_Y,
      ACC_Z: arr[i].ACC_Z,
      MAG_X: arr[i].MAG_X,
      MAG_Y: arr[i].MAG_Y,
      MAG_Z: arr[i].MAG_Z,
    };
    result.push(object);
  }
  return result
}

function drawLineGraphAcc(data1, data2, select) {

  d3.select("#chart1").selectAll("svg").remove();
  d3.select("#chart2").selectAll("svg").remove();
  console.log("drawLine");
  var dataset = [];
  //var count=2;

  var MAX_LENGTH = 100;
  var duration = 1;

  if (select == 2) {
    chart1 = realTimeLineChart();
    chart2 = realTimeLineChart();

    function seedData(data1, data2) {
      //console.log(data);
      for (var i = 0; i < 1; ++i) {
        lineArr1.push({
          time: data1[i].TIME,
          //  time: new Date(now.getTime() - ((MAX_LENGTH - i) * duration)),
          x: data1[i].collar_ACC_X,
          y: data1[i].collar_ACC_Y,
          z: data1[i].collar_ACC_Z
        });
        lineArr2.push({
          time: data2[i].TIME,
          //  time: new Date(now.getTime() - ((MAX_LENGTH - i) * duration)),
          x: data2[i].collar_ACC_X,
          y: data2[i].collar_ACC_Y,
          z: data2[i].collar_ACC_Z
        });
      }
    }


    seedData(data1, data2);

    // var timer_time = new Date(+data2[1].TIME * 1000);
    // console.log("timer_time");
    // console.log(timer_time);
    d3.select("#chart1").datum(lineArr1).call(chart1);
    chart1.width(+d3.select("#chart1").style("width").replace(/(px)/g, ""));
    d3.select("#chart1").call(chart1);

    d3.select("#chart2").datum(lineArr2).call(chart2);
    chart2.width(+d3.select("#chart2").style("width").replace(/(px)/g, ""));
    d3.select("#chart2").call(chart2);
  } else {
    chart1 = realTimeLineChart();

    function seedData(data1) {
      //console.log(data);
      for (var i = 0; i < 1; ++i) {
        lineArr1.push({
          time: data1[i].TIME,
          //  time: new Date(now.getTime() - ((MAX_LENGTH - i) * duration)),
          x: data1[i].collar_ACC_X,
          y: data1[i].collar_ACC_Y,
          z: data1[i].collar_ACC_Z
        });
      }
    }
    seedData(data1);
    d3.select("#chart1").datum(lineArr1).call(chart1);
    chart1.width(+d3.select("#chart1").style("width").replace(/(px)/g, ""));
    d3.select("#chart1").call(chart1);
  }

}

function moveSheep(data1, data2, sliderVal, initialize) {
  if (document.getElementById("both").selected == true) {
    console.log("Move Sheep");
    //console.log(count);
    sleep(100).then(() => {
      if (initialize == 1) {
        //console.log("0");
        dataset1 = data1;
        dataset2 = data2;
        sheep1.children[0].children[1].children[2].material.color.set(getActivityColor(dataset1[count]['activity']));
        sheep2.children[0].children[1].children[2].material.color.set(getActivityColor(dataset2[count]['activity']));

        initialize = 0;

      }

      if (count > 0) {
        var geometry = new THREE.CircleGeometry(0.00025, 32);
        var material1 = new THREE.MeshBasicMaterial({
          color: "#d95f02"
        });
        var circle1 = new THREE.Mesh(geometry, material1);
        var material2 = new THREE.MeshBasicMaterial({
          color: "#7570b3"
        });
        var circle2 = new THREE.Mesh(geometry, material2);
        circle1.name = "paths1" + String(count);
        circle2.name = "paths2" + String(count);
        // console.log("Rolled up data");
        // console.log(sampledData);
        if (dataset1[count - 1]['Latitude'] != "") {
          circle1.position.set(dataset1[count - 1]['Latitude'] * 20, 0.01875, (dataset1[count - 1]['Longitude'] - 36) * 20);
          App.scene.addObject(circle1);
          remove_path.push(circle1.name);
        }
        if (dataset2[count - 1]['Latitude'] != "") {
          circle2.position.set(dataset2[count - 1]['Latitude'] * 20, 0.01875, (dataset2[count - 1]['Longitude'] - 36) * 20);
          App.scene.addObject(circle2);
          remove_path.push(circle2.name);
        }
        // if (dataset1[count-1]['activity']!=dataset1[count-1]['activity']){
        //   sheep1.children[0].children[1].children[2].material.color.set(getActivityColor(dataset1[count]['activity']));
        // }
        // if (dataset2[count-1]['activity']!=dataset2[count-1]['activity']){
        //
        //   sheep2.children[0].children[1].children[2].material.color.set(getActivityColor(dataset2[count]['activity']));
        // }
        sheep1.children[0].children[1].children[2].material.color.set(getActivityColor(dataset1[count]['activity']));
        sheep2.children[0].children[1].children[2].material.color.set(getActivityColor(dataset2[count]['activity']));
        //  App.scene.render();
      }
      if (dataset1[count]['Latitude'] != "") {
        sheep1.visible = true;
        sheep1.position.set(dataset1[count]['Latitude'] * 20, 0, (dataset1[count]['Longitude'] - 36) * 20);
        g.append("circle")
          .attr("cx", x(dataset1[count]['Latitude']))
          .attr("cy", y((dataset1[count]['Longitude'])))
          .attr("r", 1)
          .style("fill", "#d95f02");
        if (dataset1[count]['collar_MAG_Y'] != "") {
          var direction = getDirection(dataset1[count]);
          //Magnetometer Readings
          var angle = direction * Math.PI / 180;
          //console.log(angle);
          sheep1.rotation.y = (angle * 1);
        }
      } else {
        sheep1.visible = false;
      }
      if (dataset2[count]['Latitude'] != "") {
        sheep2.visible = true;
        sheep2.position.set(dataset2[count]['Latitude'] * 20, 0, (dataset2[count]['Longitude'] - 36) * 20);
        g.append("circle")
          .attr("cx", x(dataset2[count]['Latitude']))
          .attr("cy", y((dataset2[count]['Longitude'])))
          .attr("r", 1)
          .style("fill", "#7570b3");
        if (dataset2[count]['collar_MAG_Y'] != "") {
          var direction = getDirection(dataset2[count]);

          var angle = direction * Math.PI / 180;
          //  console.log(angle);
          sheep2.rotation.y = (angle * 1);
          App.scene.lookAt(sheep1.position);
        }
      } else {
        sheep2.visible = false;
      }


      count = count + 1;
      //console.log(count);
      updateData(dataset1, dataset2, 2);
      // for (var j = 0; j < 100000000; j++) {}

      window.requestAnimationFrame(moveSheep);
    });
  }
}
var count_remove;

function removePathsFromScene() {

  var i;
  //console.log(remove_path);

  for (i = 0; i < remove_path.length; i++) {
    App.scene.remove(App.scene.findobj(remove_path[i]));
  }

}

function getDirection(data) {
  var direction;
  if (data['collar_MAG_Y'] > 0) {
    direction = 90 - (Math.atan(data['collar_MAG_X'] / data['collar_MAG_Y']) * (180 / Math.PI));
  } else if (data['collar_MAG_Y'] < 0) {
    direction = 270 - (Math.atan(data['collar_MAG_X'] / data['collar_MAG_Y']) * 180 / Math.PI);
  } else {
    if (data['collar_MAG_X'] < 0) {
      direction = 180;
    } else {
      direction = 0;
    }
  }
  return direction;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function moveSheepAlone(data1, sliderVal, initialize) {
  if (document.getElementById("sheep2").selected == true || document.getElementById("sheep3").selected == true) { // (document.getElementById("sheep3").selected == true)  {
    console.log("Move Sheep Alone");
    sleep(100).then(() => {
      // Do something after the sleep!
      if (initialize == 1) {
        dataset1 = data1;
        initialize = 0;
      }

      if (count > 0) {
        var geometry = new THREE.CircleGeometry(0.00025, 32);
        var material1 = new THREE.MeshBasicMaterial({
          color: "#d95f02"
        });
        var circle1 = new THREE.Mesh(geometry, material1);
        var material2 = new THREE.MeshBasicMaterial({
          color: "#7570b3"
        });
        var circle2 = new THREE.Mesh(geometry, material2);
        circle1.name = "paths1" + String(count);

        if (dataset1[count - 1]['Latitude'] != "") {
          circle1.position.set(dataset1[count - 1]['Latitude'] * 20, 0.01875, (dataset1[count - 1]['Longitude'] - 36) * 20);
          App.scene.addObject(circle1);
          remove_path.push(circle1.name);
        }

      }

      if (dataset1[count]['Latitude'] != "") {
        sheep1.visible = true;
        sheep1.position.set(dataset1[count]['Latitude'] * 20, 0, (dataset1[count]['Longitude'] - 36) * 20);
        if (dataset1[count]['collar_MAG_Y'] != "") {
          var direction = getDirection(dataset1[count]);
          //Magnetometer Readings
          var angle = direction * Math.PI / 180;
          //console.log(angle);
          sheep1.rotation.y = (angle * 1);
        }
      } else {
        sheep1.visible = false;
      }
      g.append("circle")
        .attr("cx", x(dataset1[count]['Latitude']))
        .attr("cy", y((dataset1[count]['Longitude'])))
        .attr("r", 2)
        .style("fill", "#d95f02");


      sheep1.children[0].children[1].children[2].material.color.set(getActivityColor(dataset1[count]['activity']));

      //console.log(sheep1.position);
      App.scene.lookAt(sheep1.position);


      count = count + 1;
      //console.log(count);
      updateData(dataset1, null, 1);
      // for (var j = 0; j < 100000000; j++) {}
      window.requestAnimationFrame(moveSheepAlone);
    });

  }
}

function changeAnimals() {

  var startTimeInput = document.getElementById("StartTime");
  count = startTimeInput.value - 1534395958;
  define_data();

}

function updateData(dataset1, dataset2, select) {

  //console.log(dataset[count]);
  if (select == 2) {
    var lineData1 = {
      //time: now,
      time: dataset1[count].TIME,
      x: dataset1[count].collar_ACC_X,
      y: dataset1[count].collar_ACC_Y,
      z: dataset1[count].collar_ACC_Z
    };
    var lineData2 = {
      //time: now,
      time: dataset2[count].TIME,
      x: dataset2[count].collar_ACC_X,
      y: dataset2[count].collar_ACC_Y,
      z: dataset2[count].collar_ACC_Z
    };

    lineArr1.push(lineData1);
    if (lineArr1.length > 30) {
      lineArr1.shift();
    }
    d3.select("#chart1").datum(lineArr1).call(chart1);

    lineArr2.push(lineData2);
    if (lineArr2.length > 30) {
      lineArr2.shift();
    }

    d3.select("#chart2").datum(lineArr2).call(chart2);
  } else {
    var lineData1 = {
      //time: now,
      time: dataset1[count].TIME,
      x: dataset1[count].collar_ACC_X,
      y: dataset1[count].collar_ACC_Y,
      z: dataset1[count].collar_ACC_Z
    };
    lineArr1.push(lineData1);
    if (lineArr1.length > 30) {
      lineArr1.shift();
    }
    d3.select("#chart1").datum(lineArr1).call(chart1);

  }

  var timer_time = new Date(+dataset1[count].TIME * 1000);
  // new Date(+dataset1[count].TIME * 1000);
  //  Fri Dec 02 2016 14:03:52 GMT+0530 (IST)
  // console.log("timer_time");
  // console.log(timer_time);

  d3.select("#timer").text(timer_time);
  //count=count+1;
}

function pad(num) {
  return ("0" + num).slice(-2);
}

function getTimeFromDate(timestamp) {
  var date = new Date(timestamp * 1000);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds)
}

function getActivityColor(action) {
  // console.log(action+"  xxxxxx  ");
  switch (action) {
    case "stand up":
      // console.log("1");
      return "#068b0c"; // dark green

    case "stand down":
      // console.log("2");
      return "#04f10e"; // light green

    case "walk up":
      // console.log("3");
      return "#1B07AD"; // dark blue

    case "walk down":
      return "#04B5FC"; // light blue

    case "ramble up":
      return "#FC04E9"; // dark pink

    case "ramble down":
      return "#FFB6C1"; // light pink

    case "trot":
      return "#cc6600"; // brown

    case "canter_right lead":
      return "#FCDE04"; // dark yellow

    case "canter_left lead":
      return "#FFFF99"; // Light yellow

    case "canter_unk":
      return "#cc0000"; // red

    default:
      return "black";

  }
}


function zoom() {
  g.attr("transform", d3.event.transform);
  d3.selectAll('.line').style("stroke-width", 2 / d3.event.transform.k);
  gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
  gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
}