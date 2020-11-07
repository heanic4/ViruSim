@Code
    ViewData("Title") = "Home Page"
End Code

<script type="text/javascript" src="~/Scripts/MRRMath.js"></script>
<script type="text/javascript" src="~/Scripts/jquery-3.4.1.min.js"></script>
<script type="text/javascript" src="~/Scripts/virusim.js"></script>



<div class="virusim" style="background-color: black;">
    <canvas id="virusim" width="800" height="800" style="width: 800px;height: 800px;"></canvas>
</div>

<h4 id="stats"></h4>
<div class="virusim-graph" style="background-color: black;margin-top: 10px;">
    <canvas id="virusim-graph" width="800" height="300" style="width: 800px;height: 300px;"></canvas>
</div>