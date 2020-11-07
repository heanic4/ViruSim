function MRRMath() {

}

function getXOfVector(angle, distance) {
    return (Math.cos(angle * (Math.PI / 180)) * distance);
}

function to360(ang) {
    if (ang < 0) {
        return 360 + (ang % 360);
    }
    else {
        return ang % 360;
    }
}

function avg(values) {
    var v = 0;
    var cnt = 0;

    for (var g = 0; g < arguments.length; g++) {
        if (Array.isArray(arguments[g])) {
            for (var h = 0; h < arguments[g].length; h++) {
                cnt++;
                v += arguments[g][h];
            }
        }
        else {
            cnt++;
            v += arguments[g];
        }
    }

    return v / cnt;
}

function weightMergeColors(colors) {
    var rgba = {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
        weight: 0.0
    };

    for (var g = 0; g < colors.length; g++) {
        rgba.r += colors[g].r * colors[g].weight;
        rgba.g += colors[g].g * colors[g].weight;
        rgba.b += colors[g].b * colors[g].weight;
        rgba.a += colors[g].a * colors[g].weight;
        rgba.weight += colors[g].weight;
    }

    rgba.r = rgba.r / rgba.weight;
    rgba.g = rgba.g / rgba.weight;
    rgba.b = rgba.b / rgba.weight;
    rgba.a = rgba.a / rgba.weight;

    return rgba;
}

function transitionToColor(fromRGBA, toRGBA, percentage) {
    return {
        r: fromRGBA.r + (toRGBA.r - fromRGBA.r) * percentage,
        g: fromRGBA.g + (toRGBA.g - fromRGBA.g) * percentage,
        b: fromRGBA.b + (toRGBA.b - fromRGBA.b) * percentage,
        a: fromRGBA.a + (toRGBA.a - fromRGBA.a) * percentage
    };
}

function rotatePointAroundPoint(center, point, rot) {
    var v = new MRRVector(getAngleFromTo(center.x, center.y, point.x, point.y), getDistanceFromTo(center.x, center.y, point.x, point.y));
    v.setAng(v.ang + rot);
    return { x: center.x + v.x, y: center.y + v.y };
}

function getDistanceFromLine(point, line) {
    var ang = getAngleFromTo(line.p1.x, line.p1.y, line.p2.x, line.p2.y);
    var diff = getAngleDiff(ang, 0);
    var dir = getTurnDir(ang, 0);
    var lp2 = rotatePointAroundPoint(line.p1, line.p2, diff * dir);
    var p = rotatePointAroundPoint(line.p1, point, diff * dir);

    if (p.x < line.p1.x) {
        return getDistanceFromTo(line.p1.x, line.p1.y, point.x, point.y);
    }

    if (p.x > lp2.x) {
        return getDistanceFromTo(line.p2.x, line.p2.y, point.x, point.y);
    }

    return Math.abs(p.y - lp2.y);
}

function getLinePushDir(point, line) {
    var ang = getAngleFromTo(line.p1.x, line.p1.y, line.p2.x, line.p2.y);
    var diff = getAngleDiff(ang, 0);
    var dir = getTurnDir(ang, 0);
    var lp2 = rotatePointAroundPoint(line.p1, line.p2, diff * dir);
    var p = rotatePointAroundPoint(line.p1, point, diff * dir);

    /*if (point.x < line.p1.x) {
        return getAngleFromTo(line.p1.x, line.p1.y, point.x, point.y);
    }

    if (point.x > lp2.x) {
        return getAngleFromTo(line.p2.x, line.p2.y, point.x, point.y);
    }*/

    dir = getTurnDir(0, getAngleFromTo(line.p1.x, line.p1.y, p.x, p.y));
    return getAngleFromTo(line.p1.x, line.p1.y, line.p2.x, line.p2.y) + (90 * dir);
}

function randomizeList(list) {
    var list2 = [];
    var list3 = [];

    for (var g = 0; g < list.length; g++) {
        list3.push(list[g]);
    }

    while (list3.length > 0) {
        var ind = Math.floor(Math.random() * list3.length);

        list2.push(list3[ind]);
        list3.splice(ind, 1);
    }


    return list2
}

function drawPercentHexagon(ctx, sideLength, cX, cY, perc) {
    var len = sideLength * 6;
    var tD = len * perc;

    var v = new MRRVector(-90, sideLength);

    var l = { x: cX + v.x, y: cY + v.y };

    ctx.moveTo(l.x, l.y);

    for (var g = 0; g < 6; g++) {
        v.setAng(30 + (g * 60));
        v.setMag(Math.min(tD, sideLength));

        l.x += v.x;
        l.y += v.y;

        ctx.lineTo(l.x, l.y);

        tD -= v.mag;

        if (tD == 0) {
            return;
        }
    }
}

function getYOfVector(angle, distance) {
    return (Math.sin(angle * (Math.PI / 180)) * distance);
}

function getDistanceFromTo(fromX, fromY, toX, toY) {
    return Math.sqrt(((fromX - toX) * (fromX - toX)) + ((fromY - toY) * (fromY - toY)));
}

function getAngleFromTo(fromX, fromY, toX, toY) {
    radians = Math.atan2(toY - fromY, toX - fromX);
    return (radians / Math.PI * 180);
}

function getTurnDir(fromAngle, toAngle) {
    fromAngle = to360(fromAngle);
    toAngle = to360(toAngle);

    if (fromAngle > toAngle) {
        if (fromAngle - toAngle <= 180) {
            return -1;
        }
        else {
            return 1;
        }
    }
    else {
        if (toAngle - fromAngle <= 180) {
            return 1;
        }
        else {
            return -1;
        }
    }
}

function getAngleDiff(angle1, angle2) {
    angle1 = to360(angle1);
    angle2 = to360(angle2);

    if (angle1 > angle2) {
        var tmp = angle1;
        angle1 = angle2;
        angle2 = tmp;
    }

    return (angle2 - angle1 <= 180 ? angle2 - angle1 : angle1 + (360 - angle2));
}

function checkLineIntersection(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator == 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));
    /*
            // it is worth noting that this should be the same as:
            x = line2StartX + (b * (line2EndX - line2StartX));
            y = line2StartX + (b * (line2EndY - line2StartY));
            */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a >= 0 && a <= 1) {
        result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b >= 0 && b <= 1) {
        result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
};

function drawLineMRR(ctx, p1, p2, width) {
    ctx.beginPath();

    var ang = getAngleFromTo(p1.x, p1.y, p2.x, p2.y);
    var dist = getDistanceFromTo(p1.x, p1.y, p2.x, p2.y);
    var v = new MRRVector(ang + 90, width * .5);
    var p = { x: p1.x + v.x, y: p1.y + v.y };
    ctx.moveTo(p.x, p.y);
    v.setAngMag(ang - 90, width);
    p.x += v.x;
    p.y += v.y;
    ctx.lineTo(p.x, p.y);
    v.setAngMag(ang, dist);
    p.x += v.x;
    p.y += v.y;
    ctx.lineTo(p.x, p.y);
    v.setAngMag(ang + 90, width);
    p.x += v.x;
    p.y += v.y;
    ctx.lineTo(p.x, p.y);
    v.setAngMag(ang - 180, dist);
    p.x += v.x;
    p.y += v.y;
    ctx.lineTo(p.x, p.y);
}

function MRRVector(angle, magnitude, calc) {

    this.ang = angle;
    this.mag = magnitude;

    this.x = 0;
    this.y = 0;

    if (calc || calc == null) {
        this.x = getXOfVector(this.ang, this.mag);
        this.y = getYOfVector(this.ang, this.mag);
    }
}

MRRVector.prototype.copy = function () {
    return new MRRVector(this.ang, this.mag);
}

MRRVector.prototype.setXY = function (x, y, calc) {
    this.x = x;
    this.y = y;

    if (calc || calc == null) {
        this.ang = getAngleFromTo(0, 0, x, y);
        this.mag = getDistanceFromTo(0, 0, x, y);
    }
}

MRRVector.prototype.setAngMag = function (ang, mag, calc) {
    this.ang = ang;
    this.mag = mag;
    if (calc || calc == null) {
        this.x = getXOfVector(ang, mag);
        this.y = getYOfVector(ang, mag);
    }
}

MRRVector.prototype.setMag = function (mag, calc) {
    this.mag = mag;
    if (calc || calc == null) {
        this.x = getXOfVector(this.ang, mag);
        this.y = getYOfVector(this.ang, mag);
    }
}

MRRVector.prototype.setAng = function (ang, calc) {
    this.ang = ang;
    if (calc || calc == null) {
        this.x = getXOfVector(ang, this.mag);
        this.y = getYOfVector(ang, this.mag);
    }
}

MRRVector.prototype.addVector = function (vector) {
    var tmp = new MRRVector(0, 0, false);
    tmp.setXY(this.x + vector.x, this.y + vector.y);
    return tmp;
}

