

const virusim = {
    canvas: null,
    groups: [],
    people: [],
    families: [],
    frameData: [],
    frames: 0,
    infectedTotal: 0,
    frameDelay: 5,
    renderDelay: 100,
    settings: {
        movementRate: .0005,
        infectionMinTime: 10,
        infectionMaxTime: 200,
        immuneTimeMin: 800,
        immuneTimeMax: 1500,
        isolationChance: 0.01,
        deathChance: .0001,
        infectedStart: 100,
        groupsX: 20,
        groupsY: 20,
        totalPopulation: 20000,
        minResist: .99,
        maxResist: 1,
        travelSpeed: .1,
        infectionZeroFrame: null,
        maxActive: 0,
        leaveHomeMod: 1,
        leaveNotHomeMod: 2,
        goHomeRate: .5,
        minInteractPerFrame: 1,
        maxInteractPerFrame: 10,
        isolateFamilyChance: 0.00005,
        familySize: 5
    },
    randBetweenInt: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },
    randBetween: function (min, max) {
        return Math.random() * (max - min) + min;
    },
    randomGroup: function (currGroup) {

        var grp = virusim.groups[virusim.randBetweenInt(0, virusim.groups.length)];

        while (grp == currGroup) {
            grp = virusim.groups[virusim.randBetweenInt(0, virusim.groups.length)];
        }

        return grp;
    },
    randomPerson: function () {
        return virusim.people[virusim.randBetweenInt(0, virusim.people.length)];
    },
    checkMove: function (isHome) {
        return Math.random() > (1 - (virusim.settings.movementRate * (isHome ? virusim.settings.leaveHomeMod : virusim.settings.leaveNotHomeMod)));
    },
    moveHome: function (isHome) {
        return !isHome && Math.random() >= virusim.settings.goHomeRate;
    },
    getPersonGroupLocation: function (p, g) {

        if (g == null) {
            return { x: 0, y: 0 };
        }

        var tot = g.members.length * 1.0;

        var ind = g.members.indexOf(p) * 1.0;

        var d = Math.min(35, Math.max(15, Math.sqrt((10 * g.members.length) / Math.PI)));

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
        virusim.ctx.arc(x, y, 2, 0, 2 * Math.PI);

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
    checkInfect: function (infecter, person) {
        return Math.random() >= person.resistance;
    },
    getRandomNonFamilyNonTransitionFromGroup: function (person) {

        var opts = [];

        for (var g = 0; g < person.currGroup.members.length; g++) {
            var p = person.currGroup.members[g];

            if (p != person && p.transitionPerc >= 1 && person.family.people.indexOf(p) < 0) {
                opts.push(p);
            }
        }

        return opts[virusim.randBetweenInt(0, opts.length)];
    },
    checkIsolateByFamilyInfection: function (person) {
        if (Math.random() >= (1 - virusim.settings.isolateFamilyChance)) {
            person.family.isolated = true;
        }
    },
    processGroupFrame: function (group) {
        var infected = [];
        var interactable = [];
        var clean = [];

        for (var g = 0; g < group.members.length; g++) {
            var p = group.members[g];

            if (!p.dead && p.infected) {
                infected.push(p);
            }

            if (!p.dead && p.transitionPerc >= 1 && !p.isolated && !p.family.isolated) {
                interactable.push(p);
                if (p.infected) {

                }
                else {
                    clean.push(p);
                }
            }
        }

        for (var g = clean.length - 1; g > -1; g--) {
            var person = clean[g];

            person.immuneTime--;

            if (person.transitionPerc >= 1 && person.immuneTime <= 0) {

                for (var h = 0; h < person.family.people.length; h++) {
                    var p2 = person.family.people[h];

                    if (p2 != person && p2.currGroup == person.currGroup) {
                        if (p2.infected) {
                            if (!p2.dead) {
                                if (virusim.checkInfect(p2, person)) {
                                    virusim.infectedTotal++;
                                    person.infected = true;
                                    person.infectedTime = 0;
                                    person.family.infectionCount++;
                                    person.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
                                    return;
                                }
                            }
                        }
                    }
                }


                var interact = virusim.randBetweenInt(virusim.settings.minInteractPerFrame, virusim.settings.maxInteractPerFrame + 1);

                for (var h = 0; h < interact; h++) {
                    var p2 = interactable[virusim.randBetweenInt(0, interactable.length)];

                    while (p2 == person) {
                        p2 = interactable[virusim.randBetweenInt(0, interactable.length)];
                    }
                    
                    if (p2.infected) {
                        if (virusim.checkInfect(p2, person)) {
                            virusim.infectedTotal++;
                            person.infected = true;
                            person.infectedTime = 0;
                            person.family.infectionCount++;
                            person.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
                            return;
                        }
                    }
                }
            }
        }
        
        for (var g = infected.length - 1; g > -1; g--) {
            var person = infected[g];

            if (!person.family.isolated) {
                virusim.checkIsolateByFamilyInfection(person);
            }

            person.infectedTime++;

            if (Math.random() >= (1 - virusim.settings.deathChance)) {
                person.dead = true;
                if (person.lastGroup != null && person.lastGroup.members.indexOf(person) >= 0) {
                    person.lastGroup.members.splice(person.lastGroup.members.indexOf(person), 1);
                }

                person.currGroup.members.splice(person.currGroup.members.indexOf(person), 1);

                person.lastGroup = null;
                person.currGroup = null;
                person.family.infectionCount--;
                if (person.family.infectionCount <= 0) {
                    person.family.isolated = false;
                }
                return;
            }

            if (!person.isolated) {
                person.isolated = Math.random() >= (1 - virusim.settings.isolationChance);
            }

            if (person.infectionEnd <= person.infectedTime) {
                person.infected = false;
                person.isolated = false;

                person.family.infectionCount--;
                if (person.family.infectionCount <= 0) {
                    person.family.isolated = false;
                }

                person.immuneTime = virusim.randBetweenInt(virusim.settings.immuneTimeMin, virusim.settings.immuneTimeMax);
            }
        }
    },
    //THIS FUNTION IS NOT IN USE. processGroupFrame is the replacement. Calculation outcome should be the same. Or nearly so.
    DEPRICATED_processPersonFrame: function (person) {

        if (person.dead) {
            return;
        }

        if (person.infected) {

            virusim.checkIsolateByFamilyInfection(person);

            person.infectedTime++;

            if (Math.random() >= (1 - virusim.settings.deathChance)) {
                person.dead = true;
                if (person.lastGroup != null && person.lastGroup.members.indexOf(person) >= 0) {
                    person.lastGroup.members.splice(person.lastGroup.members.indexOf(person), 1);
                }

                person.currGroup.members.splice(person.currGroup.members.indexOf(person), 1);

                person.lastGroup = null;
                person.currGroup = null;
                person.family.infectionCount--;
                if (person.family.infectionCount <= 0) {
                    person.family.isolated = false;
                }
                return;
            }

            if (!person.isolated) {
                person.isolated = Math.random() >= (1 - virusim.settings.isolationChance);
            }

            if (person.infectionEnd <= person.infectedTime) {
                person.infected = false;
                person.isolated = false;

                person.family.infectionCount--;
                if (person.family.infectionCount <= 0) {
                    person.family.isolated = false;
                }

                person.immuneTime = virusim.randBetweenInt(virusim.settings.immuneTimeMin, virusim.settings.immuneTimeMax);
            }
        }
        else {
            person.immuneTime--;

            if (person.transitionPerc >= 1 && person.immuneTime <= 0) {

                for (var g = 0; g < person.family.people.length; g++) {
                    var p2 = person.family.people[g];

                    if (p2 != person && p2.currGroup == person.currGroup) {
                        if (p2.infected) {
                            if (!p2.dead) {
                                if (virusim.checkInfect(p2, person)) {
                                    virusim.infectedTotal++;
                                    person.infected = true;
                                    person.infectedTime = 0;
                                    person.family.infectionCount++;
                                    person.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
                                    return;
                                }
                            }
                        }
                    }
                }

                var interact = virusim.randBetweenInt(virusim.settings.minInteractPerFrame, virusim.settings.maxInteractPerFrame + 1);

                for (var g = 0; g < interact; g++) {
                    var p2 = virusim.getRandomNonFamilyNonTransitionFromGroup(person);

                    if (person != p2) {
                        if (p2.transitionPerc >= 1) {
                            if (p2.infected) {
                                if (!p2.isolated && !p2.family.isolated && !p2.dead) {
                                    if (virusim.checkInfect(p2, person)) {
                                        virusim.infectedTotal++;
                                        person.infected = true;
                                        person.infectedTime = 0;
                                        person.family.infectionCount++;
                                        person.infectionEnd = virusim.randBetweenInt(virusim.settings.infectionMinTime, virusim.settings.infectionMaxTime);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    genderGraphLine: function (color, entries, max) {

        var ctx = virusim.graphCTX;

        ctx.beginPath();

        ctx.moveTo(0, 300 - 300 * (entries[0] / max));

        ctx.strokeStyle = color;

        var xd = 800 / (entries.length * 1.0);

        for (var g = 1; g < entries.length; g++) {
            ctx.lineTo(xd * g, 300 - 300 * (entries[g] / max));
        }

        ctx.stroke();
    },
    renderGraph: function () {
        var tots = [];
        var currs = [];
        var imms = [];
        var dths = [];
        var homs = [];
        var isos = [];

        var maxT = 0;
        var maxC = 0;
        var maxI = 0;
        var maxD = 0;
        var maxH = 0;
        var maxIS = 0;

        for (var g = 0; g < virusim.frameData.length; g++) {
            var d = virusim.frameData[g];

            maxT = Math.max(maxT, d.total);
            maxC = Math.max(maxC, d.current);
            maxI = Math.max(maxI, d.immune);
            maxD = Math.max(maxD, d.dead);
            maxH = Math.max(maxH, d.home);
            maxIS = Math.max(maxIS, d.isolated);

            tots.push(d.total);
            currs.push(d.current);
            imms.push(d.immune);
            dths.push(d.dead);
            homs.push(d.home);
            isos.push(d.isolated);
        }

        virusim.graphCTX.clearRect(0, 0, 800, 300);

        virusim.genderGraphLine("rgba(255, 255, 255, 1.0)", tots, maxT);

        virusim.genderGraphLine("rgba(50, 200, 50, 1.0)", currs, maxC);

        virusim.genderGraphLine("rgba(70, 70, 230, 1.0)", imms, maxI);

        virusim.genderGraphLine("rgba(170, 50, 180, 1.0)", dths, maxD);

        virusim.genderGraphLine("rgba(225, 75, 50, 1.0)", homs, maxH);

        virusim.genderGraphLine("rgba(150, 150, 150, 1.0)", isos, maxIS);
    },
    processFrame: function () {

        virusim.frames++;
        for (var g = 0; g < virusim.groups.length; g++) {
            virusim.processGroupFrame(virusim.groups[g]);
        }
        for (var g = 0; g < virusim.people.length; g++) {
            var p = virusim.people[g];

            if (!p.dead) {

                //virusim.processPersonFrame(p);

                if (p.transitionPerc < 1) {
                    p.transitionPerc += virusim.settings.travelSpeed;
                    //virusim.renderTransitionPerson(p);
                }
                else {
                    if (virusim.checkMove(p.currGroup == p.homeGroup)) {
                        if (p.lastGroup != null) {
                            p.lastGroup.members.splice(p.lastGroup.members.indexOf(p), 1);
                        }

                        p.lastGroup = p.currGroup;

                        if (virusim.moveHome(p.currGroup == p.homeGroup)) {
                            p.currGroup = p.homeGroup;
                        }
                        else {
                            p.currGroup = virusim.randomGroup(p.currGroup);
                        }

                        p.currGroup.members.push(p);

                        p.transitionPerc = 0;
                        //virusim.renderTransitionPerson(p);
                    }
                    else {
                        //virusim.renderRegularPerson(p);
                    }
                }
            }
        }

        var cnt = 0;
        var icnt = 0;
        var dcnt = 0;
        var hcnt = 0;
        var iscnt = 0;

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
                if (virusim.people[g].currGroup == virusim.people[g].homeGroup) {
                    hcnt++;
                }
                if (virusim.people[g].isolated || virusim.people[g].family.isolated) {
                    iscnt++;
                }
            }
        }
        
        virusim.frameData.push({ total: virusim.infectedTotal, current: cnt, immune: icnt, dead: dcnt, home: hcnt, isolated: iscnt });

        virusim.settings.maxActive = Math.max(cnt, virusim.settings.maxActive);

        if (cnt == 0) {
            virusim.stopped = true;
        }

        if (!virusim.stopped) {
            virusim.timeout = setTimeout(virusim.processFrame, virusim.frameDelay);
        }
    },
    renderFrame: function () {

        virusim.ctx.clearRect(0, 0, 800, 800);

        for (var g = 0; g < virusim.people.length; g++) {
            if (virusim.people[g].transitionPerc < 1) {
                virusim.renderTransitionPerson(virusim.people[g]);
            }
            else {
                virusim.renderRegularPerson(virusim.people[g]);
            }
        }

        virusim.renderGraph();

        /*if (cnt == 0 && virusim.settings.infectionZeroFrame == null) {
            virusim.settings.infectionZeroFrame = virusim.frames;
            virusim.renderGraph();
        }*/

        var d = virusim.frameData[virusim.frameData.length - 1];

        $("#stats").html("Total Infections: " + virusim.infectedTotal +
            "  Infected: " + d.current +
            "  Max Infected: " + virusim.settings.maxActive +
            "  Immune: " + d.immune +
            "  Dead: " + d.dead +
            "  Home: " + d.home +
            "  Isolated: " + d.isolated +
            "  Frames: " + virusim.frames);

        /*if (virusim.settings.infectionZeroFrame == null && virusim.frames % 5 == 0) {
            virusim.renderGraph();
        }*/


        if (!virusim.stopped) {
            virusim.timeout = setTimeout(virusim.renderFrame, virusim.renderDelay);
        }
        //alert("NO INFECTIONS. Total Infected: " + virusim.infectedTotal);
    },
    init: function () {
        virusim.canvas = $("#virusim")[0];
        virusim.ctx = virusim.canvas.getContext("2d");
        virusim.graphCanvas = $("#virusim-graph")[0];
        virusim.graphCTX = virusim.graphCanvas.getContext("2d");
        //virusim.interval = setInterval(virusim.renderFrame, 50);

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

            virusim.people[virusim.people.length - 1].homeGroup = virusim.people[virusim.people.length - 1].currGroup;
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

        var fam = { people: [], infectionCount: 0, isolated: false };
        virusim.families.push(fam);

        for (var g = 0; g < virusim.people.length; g++) {
            if (fam.people.length >= virusim.settings.familySize) {
                fam = { people: [], infectionCount: 0, isolated: false };
                virusim.families.push(fam);
            }

            fam.people.push(virusim.people[g]);
            virusim.people[g].family = fam;
        }

        virusim.processFrame();
        virusim.renderFrame();
    }
};

$(document).ready(function () {
    virusim.init();
});