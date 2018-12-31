"use strict";
d3.selection.prototype.appendSVG = d3.selection.enter.prototype.appendSVG = function(SVGString) {
  return this.select(function() {
    return this.appendChild(
      document.importNode(
        new DOMParser().parseFromString(
          '<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="filter"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10" result="filter" /><feComposite in="SourceGraphic" in2="filter" operator="atop" /></filter></defs>' + SVGString + "</svg>",
          "application/xml"
        ).documentElement.firstChild,
        true
      )
    );
  });
};

//  Note! If you do not prepare a variable for b2 World with the name world in the global variable, it will fall.
var world;
var boundsNodes = [[-2, 0], [2, 0], [2, 4], [-2, 4]]; //  Realm shape
var floaters = [
  // {nodes:[[-0.1, -0.2],[0.1, -0.2],[0.1, 0.2],[-0.1, 0.2]], pos:[0.5, 2]},
  // {nodes:[[0, 0.2],[0.1732, -0.0866],[-0.1732, -0.0866]], pos:[-1.5, 3]}
];
var pgDefs = [
  //  particleGroup Each initial shape
  // {nodes:[[0.5, 0.1], [1.9, 0.1], [1.9, 2.5], [0.5, 1.0]]},
  // { nodes: [[-0.5, 0.1], [-1.9, 0.1], [-1.9, 2.5], [-0.5, 1.0]] } ,
  {
    nodes: [[200, -130],[200, 430],  [-200, 430], [-200, -130]]
  },

];

var test = [
  [61, 463.56],
  [56, 447.56],
  [68, 405.56],
  [57, 392.56],
  [60, 331.56],
  [79, 260.56],
  [120, 154.56],
  [124, 134.56],
  [122, 121.56],
  [131, 82.56],
  [136, 36.56],
  [135, -53.44],
  [127, -114.44],
  [116, -163.44],
  [110, -229.44],
  [110, -244.44],
  [130, -341.44],
  [129, -401.44],
  [125, -413.44],
  [115, -424.44],
  [83, -437.44],
  [41, -443.44],
  [-65, -441.44],
  [-95, -435.44],
  [-120, -424.44],
  [-130, -413.44],
  [-134, -393.44],
  [-135, -355.44],
  [-131, -317.44],
  [-114, -244.44],
  [-117, -187.44],
  [-134, -96.44],
  [-141, -19.439999999999998],
  [-140, 36.56],
  [-135, 82.56],
  [-126, 121.56],
  [-127, 142.56],
  [-111, 192.56],
  [-79, 271.56],
  [-64, 331.56],
  [-61, 392.56],
  [-72, 405.56],
  [-60, 447.56],
  [-67, 461.56],
  [-65, 473.56],
  [-20, 476.56],
  [53, 474.56],
  [61, 464.56]
];

var timeStep = 1.0 / 60.0,
  velocityIterations = 8,
  positionIterations = 3;

var liquidFunWorld = {
  init: function() {
    var gravity = new b2Vec2(0, -10);
    var boundsBody, boxShape;
    var psd, particleSystem;

    //Environmental definition
    world = new b2World(gravity);

    // Rigid body (static) relation
    // boundsBody = world.CreateBody(new b2BodyDef());
    // boxShape = new b2ChainShape();
    // boxShape.vertices = boundsNodes.map(function(node) {
    //   return new b2Vec2(node[0], node[1]);
    // });
    // boxShape.CreateLoop();
    // boundsBody.CreateFixtureFromShape(boxShape, 0);

    boundsBody = world.CreateBody(new b2BodyDef());
    boxShape = new b2ChainShape();
    var zoom = 230;
    var x = 0;
    var y = -1.9;
    boxShape.vertices = test.map(function(node) {
      return new b2Vec2(node[0] / zoom - x, node[1] / zoom - y);
    });
    boxShape.CreateLoop();
    boundsBody.CreateFixtureFromShape(boxShape, 0);

    //Rigid body (dyanmic) related from here
    // create shapes
    floaters.forEach(function(floaterDef) {
      var dynamicBodyDef = new b2BodyDef(),
        body,
        shape;
      dynamicBodyDef.type = b2_dynamicBody;
      body = world.CreateBody(dynamicBodyDef);
      shape = new b2ChainShape();
      shape.vertices = floaterDef.nodes.map(function(node) {
        return new b2Vec2(node[0], node[1]);
      });
      shape.CreateLoop();
      body.CreateFixtureFromShape(shape, 1);
      body.SetTransform(new b2Vec2(floaterDef.pos[0], floaterDef.pos[1]), 0);
      // Quality definition
      body.SetMassData(new b2MassData(0.1, new b2Vec2(0, 0), 0.03));
    });

    // Start Particle (Module related from here)
    psd = new b2ParticleSystemDef();
    psd.radius = 0.04; //0.05//
    psd.dampingStrength = 0.1; //0.1 

    particleSystem = world.CreateParticleSystem(psd);

    pgDefs.forEach(function(def) {
      var shape = new b2PolygonShape(),
        pd = new b2ParticleGroupDef();
      shape.vertices = def.nodes.map(function(node) {
        var zoomm = 480;
        var xx = 0;
        var y = -2;
        return new b2Vec2(node[0] / zoomm - xx, node[1] / zoomm - y);
      });
      pd.shape = shape;
      particleSystem.CreateParticleGroup(pd);
    });

    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        "deviceorientation",
        function(e) {
          if (e.beta && e.gamma) {
            var gravity_1 = new b2Vec2(e.gamma / 5, -e.beta / 4);
            this.world.SetGravity(gravity_1);
          }
        },
        true
      );
    } else
     if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", function(e) {
        if (e.acceleration.x * 2 && e.acceleration.y * 2) {
          var gravity_1 = new b2Vec2(e.acceleration.y * 2 / 5,
            -e.acceleration.x * 2 / 4
          );
          this.world.SetGravity(gravity_1);
        }
      });
    }
    var onMotion = function(x, y) {
      if (x && y) {
        // var gravity_1 = new b2Vec2((-y) / 5, (x) / 4);
        var gravity_1 = new b2Vec2((y) / 5, (-x) / 4);
        world.SetGravity(gravity_1);
      }
    };
    if (window.DeviceMotionEvent) {
     window.addEventListener('devicemotion', function(e) {
       onMotion(e.accelerationIncludingGravity.y * 10, e.accelerationIncludingGravity.x * 10*-1);
     //  _this.onMotion(e.accelerationIncludingGravity.y * 10, e.accelerationIncludingGravity.x * 10*-1);

     }, true);
   }
  },
  update: function() {
    world.Step(timeStep, velocityIterations, positionIterations);
  }
};

var init = function() {
  liquidFunWorld.init();

  d3Renderer.init();
  window.onresize = d3Renderer.resize;
  render();
};

var render = function() {
  liquidFunWorld.update();
  d3Renderer.render(world);
  window.requestAnimationFrame(render);
};

var d3Renderer = {
  init: function() {
    var viz = d3
      .select("body")
      .append("svg")
      .attr("id", "viz")
      .append("g")
      .classed("world", true);
    // viz.appendSVG('');

    d3Renderer.resize();
  },
  render: function(world) {
    var viz = d3.select("svg#viz g.world");
    d3Renderer.drawBodies(viz, world.bodies);
    d3Renderer.drawParicles(viz, world.particleSystems[0]);
  },
  drawBodies: function(selection, bodies) {
    // 
    var bounds = d3.svg
      .line()
      .x(function(vec) {
        return vec.x;
      })
      .y(function(vec) {
        return vec.y;
      });
    var bodyGroups = selection.selectAll("g.body").data(bodies, function(b) {
      return b.ptr;
    });
    bodyGroups
      .enter()
      .append("g")
      .classed("body", true)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 0); // 0.01);
    bodyGroups.each(function(b) {
      d3
        .select(this)
        .selectAll("path")
        .data(b.fixtures)
        .enter()
        .append("path")
        .attr("d", function(fixture) {
          return bounds(fixture.shape.vertices);
        });
    });
    bodyGroups.attr("transform", function(b) {
      var pos = b.GetPosition(),
        angle = b.GetAngle() * 180 / Math.PI;
      return "translate(" + pos.x + ", " + pos.y + "), rotate(" + angle + ")";
    });
    bodyGroups.exit().remove();
  },
  drawParicles: function(selection, system) {
    // 
    var particleGroup = selection
      .selectAll("g.particle")
      .data(system.particleGroups);
    var positionBuf = system.GetPositionBuffer();
    particleGroup
      .enter()
      .append("g")
      .classed("particle", true)
      .attr("fill", "#A3252A");
    particleGroup.each(function(pg) {
      var dataSet = d3
        .select(this)
        .selectAll("circle")
        .data(new Array(pg.GetParticleCount()));
      var offset = pg.GetBufferIndex();
      dataSet
        .enter()
        .append("circle")
        .attr("r", system.radius * 0.75);
      dataSet
        .attr("cx", function(d, i) {
          return positionBuf[(i + offset) * 2];
        })
        .attr("cy", function(d, i) {
          return positionBuf[(i + offset) * 2 + 1];
        });
      dataSet.exit().remove();
    });
    particleGroup.exit().remove();
  },
  resize: function() {
    var w = window.innerWidth,
      h = window.innerHeight;
    var scale = 100; //(w < h ? w : h) * 0.20;
    var viz = d3.select("svg#viz");
    viz.style("width", "100%").style("height", h + "px");
    var translate = "translate(" + w / 2 + ", " + (h / 2 + scale * 2) + ")";
    var scale = "scale(" + scale + ", " + -scale + ")";
    viz.select("g").attr("transform", [translate, scale].join());
  }
};

window.onload = init;
