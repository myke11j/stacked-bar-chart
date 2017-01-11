
        generateBarChart = (mainData, drilledData, mainElemId, height, width) => {
            var dummyBarChart = new BarChartConstructor(mainData, drilledData, mainElemId, height, width);
            dummyBarChart.createBarChart();
        }

        function BarChartConstructor(mainData, drilledData, mainElemId, height, width)  {
            var self = this;

            //tooltip for main bar
            var maintip = d3.tip()
                      .attr('class', 'd3-tip')
                      .offset([-10, 0])
                      .html(function(d) {
                        return '<span>'+d.id + '<br>' + d.value +'<span>';
                      })

            //tooltip for stack bar
            var stacktip = d3.tip()
                      .attr('class', 'd3-stack-tip')
                      .offset([-10, 0])
                      .html(function(d) {
                        return '<span>'+d.id + '<br>' + d.value +'<span>';
                      })
            stacktip.direction('e'); //east

            //tooltip for setting icon
            var settingMsgTip = d3.tip()
                      .attr('class', 'd3-setting-tip')
                      .offset([-10, 0])
                      .html(function(d) {
                        return '<span>Change bar colour<br>Filter out bar';
                      })

            self.mainData = mainData;
            self.drillData = drilledData;
            self.drillDataObject = {}; // it will store array of countries with continent name as index for that array
            self.elm = mainElemId;
            self.svg = {
                width: width,
                height: height
            }
            self.margin = {
                top : 30,
                right: 30,
                bottom: 40,
                left: 50
            }
            self.stackedFlag = []; // to check which bar is showing stack in case mouseout event fails
            self.colors = {
                grey : '#7f7c9e',
                white : '#fff',
                black : '#000',
                svgBackground : '#f4f4f4',
                stackStroke : '#f5f5dc',
                stackHover : '#4F70BB',
                barStart : '#339CFF',
                barEnd :  '#0F368E'
            }

            self.createBarChart = createBarChart;
            self.createBarChartMainData = createBarChartMainData;
            self.createBarChartDrillData = createBarChartDrillData;
            self.drawBarChart = drawBarChart;
            self.drawScales = drawScales;
            self.drawAxisScales = drawAxisScales;
            self.drawYAxis = drawYAxis;
            self.drawXAxis = drawXAxis;
            self.renderBarChart = renderBarChart; //rendering of svg and main bar are done here
            self.addSVGAnimation = addSVGAnimation; //simple animation for svg container at initial load
            self.addSettingsLabel = addSettingsLabel;
            self.addBarLabelOnLoad = addBarLabelOnLoad;
            self.createStackBar = createStackBar; //its job is to get continent object and its contries array and pass it to createStackedRect function 
            self.createStackedRect = createStackedRect;
            self.addStackTransition = addStackTransition; //rect moving right on hover
            self.removeStackTransition = removeStackTransition; //placing rect back on the original position
            self.getContienentById = getContienentById;
            self.findMaxValue = findMaxValue;
            self.findSumOfArrayExcludingLastElm = findSumOfArrayExcludingLastElm; //it is used to get height for palcing rects over one another in stack layout
            self.generateColorRange = generateColorRange;
            self.showStackBar = showStackBar;
            self.hideStackBar = hideStackBar;

            function createBarChart () {
                createBarChartMainData();
                drawBarChart();
            }

            function createBarChartMainData () {
                var counter = 0;
                self.mainDataArray = []; //this will be the dataset for bar chart
                for(var i in self.mainData) {
                    self.mainDataArray.push({
                        id: i,
                        value: self.mainData[i],
                        continent_id : counter
                        // hasChild: false,
                        // child : {}
                    });
                    self.createBarChartDrillData(i, counter);
                    counter++;
                }
                self.findMaxValue(); //they can only be called once we have array of main data so
                generateColorRange(); //thats why calling from here
            }

            function createBarChartDrillData (index, counter) {
                var countryCounter= 0;
                self.drillDataObject[index] = []; 
                for(var i in self.drillData) {
                    var countryObj =  self.drillData[i]
                    if(i == index) {
                        for(var j in countryObj) {
                            self.drillDataObject[index].push({
                                id: j,
                                value: countryObj[j],
                                country_id : countryCounter,
                                parent : counter
                            });
                            countryCounter++;
                        }
                    }
                }
            }

            function drawBarChart() {
                drawScales();
                renderBarChart();
                drawAxisScales();
                drawYAxis();
                drawXAxis();
            }

            function drawScales() {
                self.yScale = d3.scale.linear()
                            .domain([0, self.max])
                            .range([0, self.svg.height]);

                self.xScale = d3.scale.ordinal()
                            .domain(d3.range(0, self.mainDataArray.length))
                            .rangeBands([0, self.svg.width]);
            }

            function drawAxisScales() {
                self.vScale = d3.scale.linear()
                        .domain([0, self.max])
                        .range([self.svg.height, 0]);

                self.hScale = d3.scale.ordinal()
                        .domain(d3.range(0, self.mainDataArray.length))
                        .rangeBands([0, self.svg.width]);

            }

            function drawXAxis() {
                var xAxis = d3.svg.axis()
                                .scale(self.hScale)
                                .orient('bottom')
                                .tickValues(self.hScale.domain().filter(function(d,i) {
                                    return !( i % (self.mainDataArray.length/6))
                                }))

                var xGuide = d3.select('svg')
                                .append('g')
                                xAxis(xGuide)
                                xGuide.attr('transform', 'translate('+  self.margin.left +','+ (self.svg.height + self.margin.top) +')')
                                xGuide.selectAll('path')
                                    .style('fill', 'none')
                                    .style('stroke', self.colors.black)
                                xGuide.selectAll('line')
                                    .style('stroke', self.colors.black)
            }

            function drawYAxis() {
                var yAxis = d3.svg.axis()
                                .scale(self.vScale)
                                .orient('left')
                                .ticks(5)
                                .tickPadding(5);

                var yGuide = d3.select('svg')
                                .append('g')
                                yAxis(yGuide)
                                yGuide.attr('transform', 'translate('+  self.margin.left +','+ self.margin.top +')')
                                yGuide.selectAll('path')
                                    .style('fill', 'none')
                                    .style('stroke', self.colors.white)
                                yGuide.selectAll('line')
                                    .style('stroke', self.colors.white)
            }

            function renderBarChart() {

                var myBarChart = d3.select('#'+self.elm).append('svg')
                           .attr('height', self.svg.height + self.margin.top + self.margin.bottom)
                           .attr('width', self.svg.width + self.margin.right + self.margin.left)
                           .classed('cu-svg-container', true)
                           .style('padding-left', '90px')
                           .call(maintip)
                           .call(stacktip)
                           .call(settingMsgTip)
                           .append('g')
                                .attr('transform', 'translate('+ self.margin.left +','+ self.margin.top +')')
                                .style('background', self.colors.svgBackground)
                                .attr('class', 'bar-chart')

                           .selectAll('g')
                                .data(self.mainDataArray, function(d) {
                                    return d.value;
                                })
                                .enter()
                                .append('g')
                                .attr('class', function(d) {
                                    return 'main-bar-group-'+d.id;
                                });

                
                var barChart = myBarChart.append('rect')
                    .attr('class', function(d) {
                        return 'main-bar main-bar-'+d.id;
                    })
                    .attr('height', function(d, i) {
                        return 0;
                    })
                    .attr('width', self.xScale.rangeBand() - 20)
                    .style('fill', function(d, i) {
                        return self.barColors(i);
                    })
                    .attr('x', function(d, i) {
                        return self.xScale(i);
                    })
                   .attr('y', function(d) {
                        return self.svg.height;
                    })
                   .on('mouseover', function(d) {
                        maintip.show(d);
                        self.stackedFlag[d.id] = {};
                        self.stackedFlag[d.id].flag = true;// right now useless
                        setTimeout(function() {
                            showStackBar(d.id);
                            for(var i in self.stackedFlag) {
                                if(i != d.id) {
                                    hideStackBar(i); //here I am hiding all the stack bar container except the one I am on right now
                                }
                            }
                        }, 500);
                   })
                   .on('mouseout', function(d) {
                        maintip.hide(d);
                   })
                   addSVGAnimation(barChart); 
                   addSettingsLabel(myBarChart);
                   addBarLabelOnLoad(myBarChart);
                   createStackBar();
            }

            function addSVGAnimation(svgElement) {
                var animateDuration = 700,
                    animateDelay = 30;

                svgElement.transition()
                  .attr('height', function(d) {
                    return self.yScale(d.value);
                  })
                  .attr('y', function(d) {
                    return self.svg.height - self.yScale(d.value);
                  })
                  .duration(animateDuration)
                  .delay(function(d, i) {
                    return i * animateDelay;
                  })
                  .ease('elastic')
            }

            function addSettingsLabel(myBarChart) {
               myBarChart.append('text')
                    .classed('setting-icon', 'true')
                    .attr('font-family', 'FontAwesome')
                    .attr('font-size', function(d) { return '1.2em'})
                    .attr('fill', self.colors.grey)
                     .attr('x', function(d, i) {
                        return self.xScale(i) + 50;
                    })
                   .attr('y', function(d, i) {
                        return self.svg.height - self.yScale(d.value) - 10;
                    })
                    .text(function (d) { 
                        return '\uf013';
                    })
                    .style('cursor', 'pointer')
                    .on('mouseover', settingMsgTip.show)
                    .on('click',  settingMsgTip.hide);
            }

            function addBarLabelOnLoad(myBarChart) {
                 myBarChart.append('text')
                    .attr('class', function(d) {
                        return 'main-label-text-'+d.id;
                    })
                    .attr('font-size', function(d) { return '1.2em'})
                    .attr('fill', self.colors.grey)
                     .attr('x', function(d, i) {
                        return self.xScale(i);
                    })
                   .attr('y', function(d, i) {
                        return self.svg.height - self.yScale(d.value) - 10;
                    })
                    .text(function (d) { 
                        return d.id;
                    })
                    .style('font-size', '10px');
            }

            function createStackBar() {
                for(var i in self.mainDataArray) {
                    var index = self.mainDataArray[i].id;
                    createStackedRect(self.drillDataObject[index], self.mainDataArray[i]);
                }
            }

            function createStackedRect(stackArray, mainBarObj) {
                var stackHeightArr = [];
                var stackBar = d3.select(".main-bar-group-"+mainBarObj.id)
                .append('g')
                .attr('class', 'stack-bar-group-'+mainBarObj.id)
                .classed('hide-element' ,true)
                .selectAll('g')
                .data(stackArray, function(d) {
                    return d.value;
                })
                .enter()
                .append('g')
                .on('mousemove', function(d) {
                    var contienent = getContienentById(d.parent)
                    showStackBar(contienent.id);
                    stacktip.show(d);
                    addStackTransition(d);
                })
                .on('mouseout', function(d) {
                    stacktip.hide(d);
                    var contienent = getContienentById(d.parent)
                    hideStackBar(contienent.id);
                    removeStackTransition(d)
                });;

                stackBar.append('rect')
                .attr('class', function(d) {
                    return 'stack-bar stack-bar-'+d.id;
                })
                .attr('height', function(d, i) {
                    return self.yScale(d.value);
                })
                .attr('width', self.xScale.rangeBand() - 20)
                .style('fill', function(d, i) {
                    var contienent = getContienentById(d.parent)
                    return self.barColors(contienent.continent_id);
                })
                .style('stroke', self.colors.stackStroke)
                .attr('x', function(d, i) {
                    return self.xScale(d.parent);
                })
                .attr('y', function(d, i) {
                    stackHeightArr.push(self.yScale(d.value));
                    var sum = findSumOfArrayExcludingLastElm(stackHeightArr);
                    return (self.svg.height - self.yScale(d.value)) - sum;
                })
                
                stackHeightArr = []; //re-initializing this array to get y for text
                
                stackBar.append('text')
                   .text(function(d) {
                       return d.id;
                   })
                   .attr('x', function(d, i) {
                        var stackX = self.xScale(d.parent);
                        var stackWidth = self.xScale.rangeBand() - 20
                        return stackX + (stackWidth/2) ;
                    })
                    .attr('y', function(d, i) {
                        stackHeightArr.push(self.yScale(d.value));
                        var sum = findSumOfArrayExcludingLastElm(stackHeightArr);
                        var stackY = (self.svg.height - self.yScale(d.value)) - sum;
                        var stackHeight = self.yScale(d.value);
                        return stackY + (stackHeight/2);
                    })
                   .attr('dy', '.35em')
                   .style('fill', self.colors.white)
                   .style("font-size", function(d) { return Math.min(2 * 13, (2 * 13 - 8) / this.getComputedTextLength() * 24) + "px"; })
                   .style("text-anchor", "middle")
                   .style("opacity", 1)
                   .style("z-index", 1)
            }

            function addStackTransition(data) {
                var contienent = getContienentById(data.parent);
                d3.select('.main-bar-'+contienent.id).style('opacity', '0')
                d3.select('.stack-bar-'+data.id)
                .style('fill', self.colors.stackHover)
                .transition()
                .ease("elastic")
                .duration("2000")
                .attr("x", function(d, i) {
                    return self.xScale(d.parent) + 10;
                });
            }

            function removeStackTransition(data) {
                var contienent = getContienentById(data.parent)
                d3.select('.stack-bar-'+data.id)
                .style('fill',  function(d, i) {
                    var contienent = getContienentById(d.parent)
                    return self.barColors(contienent.continent_id);
                })
                .transition()
                .ease("elastic")
                .duration("1000")
                .attr("x", function(d, i) {
                    return self.xScale(d.parent);
                });
                d3.select('.main-bar-'+contienent.id).style('opacity', '1')
            }

            function getContienentById(id) {
                for(var i in self.mainDataArray) {
                    if(self.mainDataArray[i].continent_id == id) {
                        return self.mainDataArray[i];
                    }
                }
            }

            function findMaxValue() {
                self.max = d3.max(self.mainDataArray, function(d) { return +d.value;} );
            }

            function findSumOfArrayExcludingLastElm(arr) {
                var sum = 0;
                for(var i in arr) {
                    if(i != (arr.length - 1)) {
                        sum += arr[i];
                    }
                }
                return sum;
            }

            function generateColorRange() {
                self.barColors = d3.scale.linear()
                        .domain([0, self.mainDataArray.length])
                        .range([self.colors.barStart, self.colors.barEnd]);
            }

            function showStackBar(className) {
                $('.stack-bar-group-'+className).addClass('show-element');
                $('.stack-bar-group-'+className).removeClass('hide-element');
            }

            function hideStackBar(className) {
                $('.stack-bar-group-'+className).removeClass('show-element');
                $('.stack-bar-group-'+className).addClass('hide-element');
            }
        }