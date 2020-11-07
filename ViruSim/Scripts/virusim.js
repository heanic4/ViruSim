

const virusim = {
    canvas: null,
    groups: [],
    people: [],
    frames: 0,
    infectedTotal: 0,
    settings: {
        movementRate: .01,
        infectionMinTime: 10,
        infectionMaxTime: 200,
        immuneTimeMin: 800,
        immuneTimeMax: 1500,
        isolationChance: .01,
        deathChance: .00005,
        infectedStart: 100,
        groupsX: 10,
        groupsY: 10,
        totalPopulation: 5000,
        minResist: .999,
        maxResist: .999999,
        travelSpeed: .1,
        infectionZeroFrame: null,
        maxActive: 0
    },
    randBetweenInt: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    randBetween: function (min, max) {
        return Math.random() * (max - min) + min;
    },
    randomGroup: function () {
        return virusim.groups[virusim.randBetweenInt(0, virusim.groups.length)];
    },
    randomPerson: function () {
        return virusim.people[virusim.randBetweenInt(0, virusim.people.length)];
    },
    checkMove: function () {
        return Math.random() > (1 - virusim.settings.movementRate);
    },
    getPersonGroupLocation: function (p, g) {
        var tot = g.members.length * 1.0;

        var ind = g.members.indexOf(p) * 1.0;

        var d = Math.min(50, Math.max(25, Math.sqrt((10 * g.members.length) / Math.PI)));

        if (ind < 0) {
            ind = 0.0;
        }

        var perc = ind / tot;

        var v = new MRRVector(perc * 360, d);

        return { x: v.x + g.x, y: v.y + g.y };
    },
    renderTransitionPerson: function (p) {
        var l1 = virusim.getPersonGroupLocation(p, p.lastGroup);
        var l2 = virusim.getPersonGroupLocation(p, p.currGroup);

        var xd = l2.x - l1.x;
        var yd = l2.y - l1.y;

        var lx = l1.x + (xd * p.transitionPerc);
        var ly = l1.y + (yd * p.transitionPerc);

        virusim.renderPerson(lx, ly, p.infected, p.infectedTime, p.infectionEnd, p.immuneTime > 0);
    },
    renderRegularPerson: function (p) {
        var l = virusim.getPersonGroupLocation(p, p.currGroup);

        virusim.renderPerson(l.x, l.y, p.infected, p.infectedTime, p.infectionEnd, p.immuneTime > 0);
    },
    renderPerson: function (x, y, infected, infectedTime, infectionEnd, immune) {
        virusim.ctx.beginPath();
        virusim.ctx.arc(x, y, 3, 0, 2 * Math.PI);

        if (infected) {
            virusim.ctx.fillStyle = "rgba(50, " + (100 + Math.min(1, (infectedTime / infectionEnd)) * 155) + ", 50, 1.0)";
        }
        else {
            if (immune) {
                virusim.ctx.fillStyle = "blue";
            }
            else {
                virusim.ctx.fillStyle = "white";
            }
        }
        virusim.ctx.fill();
    },
    checkInfect: function (person) {
        return Math.random() >= person.resistance;
    },
    processPersonFrame: function (person) {
        if (person.infected) {
            person.infectedTime++;

            if (Math.random() >= (1 - virusim.settings.deathChance)) {
                person.dead = true;
                if (person.lastGroup.members.indexOf(person) >= 0) {
                    person.lastGroup.members.splice(person.lastGroup.members.indexOf(person), 1);
                }

                person.currGroup.members.splice(person.currGroup.members.indexOf(person), 1);

                person.lastGroup = null;
                person.currGroup = null;
                return;
            }

            if (!person.isolated) {
                person.isolated = Math.random() >= (1 - virusim.settings.isolationChance);
            }

            if (person.infectionEnd <= person.infectedTime) {
                person.infected = false;
                person.isolated = false;
                person.immuneTime = virusim.randBetweenInt(virusim.settings.immuneTimeMin, virusim.settings.immuneTimeMax);
            }
        }
        else {
            person.immuneTime--;

            if (person.transitionPerc >= 1 && person.immuneTime <= 0) {
                for (var g = 0; g < person.currGroup.members.length; g++) {
                    var p2 = person.currGroup.members[g];

                    if (person != p2) {
                        if (p2.transitionPerc >= 1) {
                            if (p2.infected) {
                                if (!p2.isolated && !p2.dead) {
                                    if (virusim.checkInfect(person)) {
                                        virusim.infectedTotal++;
                                        person.infected = true;
                                        person.infectedTime = 0;
                                        person.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    renderFrame: function () {

        virusim.frames++;
        virusim.ctx.clearRect(0, 0, 800, 800);

        for (var g = 0; g < virusim.people.length; g++) {
            var p = virusim.people[g];

            if (!p.dead) {

                virusim.processPersonFrame(p);

                if (p.transitionPerc < 1) {
                    p.transitionPerc += virusim.settings.travelSpeed;
                    virusim.renderTransitionPerson(p);
                }
                else {
                    if (virusim.checkMove()) {
                        if (p.lastGroup != null) {
                            p.lastGroup.members.splice(p.lastGroup.members.indexOf(p), 1);
                        }

                        p.lastGroup = p.currGroup;
                        p.currGroup = virusim.randomGroup();

                        p.currGroup.members.push(p);

                        p.transitionPerc = 0;
                        virusim.renderTransitionPerson(p);
                    }
                    else {
                        virusim.renderRegularPerson(p);
                    }
                }
            }
        }

        var cnt = 0;
        var icnt = 0;
        var dcnt = 0;

        for (var g = 0; g < virusim.people.length; g++) {
            if (virusim.people[g].dead) {
                dcnt++;
            }
            else {
                if (virusim.people[g].infected) {
                    cnt++;
                }
                if (virusim.people[g].immuneTime > 0) {
                    icnt++;
                }
            }
        }

        virusim.settings.maxActive = Math.max(cnt, virusim.settings.maxActive);

        if (cnt == 0 && virusim.settings.infectionZeroFrame == null) {
            virusim.settings.infectionZeroFrame = virusim.frames;
        }

        $("#stats").html("Total Infections: " + virusim.infectedTotal + "  Infected: " + cnt + "  Max Infected: " + virusim.settings.maxActive + "  Immune: " + icnt + "  Dead: " + dcnt + "  Frames: " + (cnt == 0 ? virusim.settings.infectionZeroFrame : virusim.frames));

        //alert("NO INFECTIONS. Total Infected: " + virusim.infectedTotal);
    },
    init: function () {
        virusim.canvas = $("#virusim")[0];
        virusim.ctx = virusim.canvas.getContext("2d");
        virusim.interval = setInterval(virusim.renderFrame, 100);

        var groupWid = virusim.settings.groupsX;
        var groupHei = virusim.settings.groupsY;

        var minResistance = virusim.settings.minResist;
        var maxResistance = virusim.settings.maxResist;

        var numberOfPeople = virusim.settings.totalPopulation;
        var infectedCount = virusim.settings.infectedStart;
        virusim.infectedTotal = infectedCount;

        for (var g = 0; g < groupWid; g++) {
            for (var h = 0; h < groupHei; h++) {
                virusim.groups.push({
                    x: (800 / groupWid) * g + ((800 / groupWid) * .5),
                    y: (800 / groupHei) * h + ((800 / groupHei) * .5),
                    members: []
                });
            }
        }

        for (var g = 0; g < numberOfPeople; g++) {
            virusim.people.push({
                lastGroup: null,
                currGroup: virusim.randomGroup(),
                transitionPerc: 1,
                infected: false,
                isolated: false,
                dead: false,
                infectedTime: 0,
                infectionEnd: 0,
                immuneTime: 0,
                resistance: virusim.randBetween(minResistance, maxResistance)
            });

            virusim.people[virusim.people.length - 1].currGroup.members.push(virusim.people[virusim.people.length - 1]);
        }

        for (var g = 0; g < infectedCount; g++) {
            var p = virusim.randomPerson();

            while (p.infected) {
                p = virusim.randomPerson();
            }

            p.infected = true;
            p.infectedTime = 0;
            p.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
        }
    }
};

$(document).ready(function () {
    virusim.init();
});