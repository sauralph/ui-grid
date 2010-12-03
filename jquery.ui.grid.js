;(function($){

$.widget( "ui.grid", {
	options:{
		localSorting:false,
		titleBar:true,
		footerBar:true,
		buttons:{
			"< Previous":{text:false,icons:{primary:"ui-icon-triangle-1-w"}},
			"Add":{icons:{primary:"ui-icon-plus"},click:function(){
				//if($.dialog()){
					var grid = $(this).parents("div.ui-grid-footer").prev("table");
					var columnNames = grid.find("tr:has(th):first th").map(function(i,e){
						return {name:$(e).text(),abbr:e.abbr};
					}).get();

					var fields = $("<fieldset/>").appendTo("<form/>");
					for (var i=0; i < columnNames.length; i++) {
						$("<label>",{"style":"display:block;","for":columnNames[i].abbr,"text":columnNames[i].name}).appendTo(fields);
						$("<input>",{"style": "display:block;","type":"text","name":columnNames[i].abbr,"class":"text ui-widget-content ui-corner-all"}).appendTo(fields);
					};			
					$("<div/>").append("<p/>",{text:"Add New Record"}).append(fields.parent("form")).appendTo("body").dialog({
						title:"Add new Record",
						buttons:{
							"Add":function(){
								var row = {};
								var out = $("input",this).map(function(i,e){return {value:$(e).val(),column:e.name};}).get();
								for (var i=0; i < out.length; i++) {
									row[out[i].column]=out[i].value;
								};
								grid.grid("insertRow",row);
								$("input",this).val("").first().focus();
							},
							"Close":function() {
								$( this ).dialog( "close" );
								$( this ).remove();
							}
						}
					});
					
				//}
			}},
			"Remove":{icons:{primary:"ui-icon-trash"}},
			"Refresh":{icons:{primary:"ui-icon-refresh"},click:function(){$(this).parents("div.ui-grid-footer").prev("table").grid("refresh")}},
			"Next >":{text:false,icons:{primary:"ui-icon-triangle-1-e"}},
			"&#931;":{icons:false}
		},
		parser:function(data,type){
			switch(type){
				case "html":
				case "xml":					
					return $(data).children().children().map(function(i,e){
						var row = {};
						var childs = $(e).children();
						if(childs.length>0){
							for (var i = childs.length - 1; i >= 0; i--){
								var n = childs.eq(i);
								row[n.get(0).tagName] = n.text();
							};
						}
						for (var i = 0; i < e.attributes.length; i++) {
						  var attrib = e.attributes[i];
							row[attrib.name]=attrib.value;
						}
						return row;
					}).get();
				case "json":
					return $.parseJSON(data);
				case "text":
					if($.csv){
						return jQuery.csv2json()(data);
					}else{
						throw new Error("CSV parser plug-in not found. Please download form: http://code.google.com/p/js-tables/wiki/CSV");
					}
				default:
					throw new Error("Unknown data!");
			}
		},
		sort:{	
			"default" : function(a,b){
				return a.value - b.value;
			},

			"reverse" : function(a,b){
				return b.value-a.value;
			}

		},
		url:false,
		ajaxOptions:{
		  type: 'GET',
		  dataType: "json"
		},
		editors:{
			"default":function(cellData){
				return $("<input/>",{"value":cellData.value,"type":"text"}).blur(function(){
					cellData.gridInstance.setCellValue(cellData.rowOrdinal,cellData.columnOrdinal,$(this).val());
					$(this).fadeOut("fast",function(){
						$(this).remove();
					});
					
				}).keydown(function(event){
					var keyCode = $.ui.keyCode;
					var grid = cellData.gridInstance;
					var row = cellData.rowOrdinal;
					var col = cellData.columnOrdinal;
					switch ( event.keyCode ) {
						case keyCode.RIGHT:
							grid.editCell(row,col+1);
							$(this).blur();							
							break;
						case keyCode.DOWN:
							grid.editCell(row+1,col);
							$(this).blur();							
							break;
						case keyCode.LEFT:
							grid.editCell(row,col-1);
							$(this).blur();							
							break;
						case keyCode.UP:
							grid.editCell(row-1,col);
							$(this).blur();							
							break;
						case keyCode.ENTER:
							$(this).blur();
							break;
						case keyCode.ESCAPE:
							//do not commit
							$(this).unbind("blur").fadeOut("fast",function(){
								$(this).remove();
							});
							//exit mode
					}
				});
			}
		}
	},
	_create:function(){
		var self = this;
		var table = this.element;
		
		//build wrapper
		table.wrap($("<div/>",{"class":"ui-grid ui-widget ui-widget-content ui-corner-all"}));
		
		//build title
		
		table.before($("<div/>",{"text":table.find("caption").hide().text(),"class":"ui-grid-header ui-widget-header ui-corner-top"}));
		
		//build footer
		var buttons = $("<div/>",{"class":"ui-grid-paging ui-helper-clearfix"});
		var node;
		if(this.options.buttons){
			for(name in this.options.buttons){
				node = $("<a/>",{"html":name}).button(this.options.buttons[name]);
				buttons.append(node);
				if(this.options.buttons[name].click){
					node.click(this.options.buttons[name].click);
				}
			}
			buttons.buttonset();	
		}
		

		
		
		var results = $("<div/>",{"class":"ui-grid-results"});
		var footer  = $("<div/>",{
			"text":table.attr("summary"),
			"class":"ui-grid-footer ui-widget-header ui-corner-bottom ui-helper-clearfix"
			}).wrapInner(results).prepend(buttons);
			
		table.after(footer);
		
		//applying to table
		
		table.addClass("ui-grid-content ui-widget-content");
		
		//styling TH
		
		table.find("th").each(function(i,e){
			var $e = $(e);
			//set abbr
			var abbr = $e.text().toLowerCase();
			abbr = abbr.split(" ").join("_");//John Resig says this is faster....or was faster....or it works on all browsers...or something
			$e.attr("abbr",abbr);
			//if no id generate one
			if(!$e.attr("id")){
				$e.attr("id",abbr.concat("_",Math.ceil(Math.random()*10000)));
			}
		}).attr("scope","col").addClass("ui-state-default").wrapInner($("<a/>",{"href":"#"})).find("a").prepend($("<span>",{"class":"ui-icon ui-icon-triangle-1-s"}));
		
		//start structural Index
		this._index();
		
		
		//styling regular Cells
		
		table.find("td").addClass("ui-widget-content");
		
		//registring behaviour for rows
		
		// table.find("tr:has(td)")
		// .hover(
		// 	function(){ $('td', this).addClass('ui-state-hover');},
		// 	function(){ $('td', this).removeClass('ui-state-hover');}
		// )
		// .toggle(
		// 	function(){ $('td', this).addClass('ui-state-highlight');},
		// 	function(){ $('td', this).removeClass('ui-state-highlight');}
		// );
		
		$("td",table).live("mouseenter",function(){
			$(this).addClass('ui-state-hover');
		});
		
		$("td",table).live("mouseout",function(){
			$(this).removeClass('ui-state-hover');
		});
		
		$("td",table).live("click",function(){
			$(this).parents("table").find("td").removeClass('ui-state-highlight');
			$(this).toggleClass('ui-state-highlight');
		});
		
		$("td",table).live("click",function(){
			$(this).parents("table").find("td").removeClass('ui-state-highlight');
			$(this).toggleClass('ui-state-highlight');
		});
		
		$("td",table).live("dblclick",function(){
			var col = $(this).data("columnOrdinal");
			var row = $(this).data("rowOrdinal");
			self.editCell(row,col);
		});
		
		
		
		//building menu
		this.menu = $( "<ul/>" );
		this.menu.append($("<li/>",{"style":"cursor:pointer;"}).append($("<a/>",{"data":{"command":function(c){self.sort(c,"default")}},"text":"Order Ascending"})));
		this.menu.append($("<li/>",{"style":"cursor:pointer;"}).append($("<a/>",{"data":{"command":function(c){self.sort(c,"reverse")}},"text":"Order Descending"})));
		this.menu.append($("<li/>",{"style":"cursor:pointer;"}).append($("<a/>",{"data":{"command":function(c){alert(c+" Placeholder!")}},"text":"Filter by this field..."})));
		this.menu.append($("<li/>",{"style":"cursor:pointer;"}).append($("<a/>",{"data":{"command":function(c){alert(c+" Placeholder!")}},"text":"Group by this field..."})));
		
		this.menu.menu({
			selected:function(event,data){
				//theres got to be a better way to do this...
				fn = $("a#ui-active-menuitem").data("command");
				column = self.menu.data("column");
				try{
					fn(column);
				}finally{
					self.menu.slideToggle("fast");	
				}
				
			}
		}).appendTo("body").hide();

		
		table.find("th a").click(function(){
			var position = $(this).position();
			self.menu.css({
				position:'absolute',
				top:position.top+$(this).outerHeight(),
				left:position.left,
				width:$(this).width
				});
			self.menu.slideToggle("fast");
			self.menu.data("column",$(this).parent("th").index()+1);
		});	
		
		
	},
	sort:function(column,fn){
		switch(typeof fn){
			case "string":
				if(this.options.sort[fn]){
					fn = this.options.sort[fn];
				}else{
					throw new Error("Sort function "+fn+" not defined in options");
				}
				break;
			case "undefined":
			default:
				if($.isFunction(fn)){
					break;
				}else{
					fn = this.options.sort["default"];
				}
		}
		
		var reference = this.getColumnValues(column,function(e,i){
			return {value:$(e).text(),row:$(e).parent("tr")}
		});
		//var original = reference;
		reference.sort(fn);
		
		var tbody = this.element.find("tbody");
		
		for (var i = reference.length - 1; i >= 0; i--){
			reference[i].row.prependTo(tbody);
		};
		//all done?
		//reindex...
		this._index();
		
	},
	
	getColumn:function(column){
		if(isNaN(column)||column===0){
			column=1;
		}
		return this.element.find("tr:not(:has(th)) td:nth-child("+column+")"); 
	},
	
	getRowByOrder:function(row){
		var selector;
		if(row.push){
			row = row.join("), tr:eq(");
		}
		
		if(row.toString().indexOf(":")===0){
			selector = row.toString();
		}else{
			selector = ":eq(".concat(row.toString(),")");
		}
		
		return this.element.find("tr"+selector);
	},
	
	getRowById:function(id){
		if($.isArray(id)){
			id = id.join(", tr#");
		}
		return this.element.find("tr#"+id);
	},
	
	getColumnValues:function(column,parser){
		var set = this.getColumn(column);
		
		// if(typeof parser ==="undefined"){
		// 	parser = function(input,index){
		// 		return $(input).text();
		// 	}
		// }
		var self = this;
		return set.map(function(i,e){ return self.getCellValue(e,parser) }).get();
		
	},
	
	getRowValuesById:function(id,parser){
		if(typeof parser ==="undefined"){
			parser = function(input){
				return $(input).text();
			}
		}
		return this.getRowById(id).find("td").map(function(i,e){ return parser(e,i) }).get();
	},
	
	getRowValuesByOrder:function(order,parser){
		if(typeof parser ==="undefined"){
			parser = function(input){
				return $(input).text();
			}
		}
		return this.getRowByOrder(order).find("td").map(function(i,e){ return parser(e,i) }).get();
	},
	
	getCell:function(row,column){
		if(row.tagName==="TD"||(row.is&&row.is("td"))){
			return row;
		}else{
			return this.element.find("tr:nth-child("+row+") td:nth-child("+column+")"); 
		}
		
	},
	/*
	getCellValue(row,column[,parser])
	getCellValue(cell[,parser])
	*/
	getCellValue:function(row,column,parser){
	//	if(typeof parser ==="undefined"){
		//	parser = function(input){
		//		return input;
		//	}
		//}
		var cell;
		if(row.tagName==="TD"||(row.is&&row.is("td"))){
			cell = $(row);
			parser = column || parser;
		}else{
			cell=this.getCell(row,column);
			//throw new Error("Invalid Row/Cell Parameter");
		}
		
		var fallback = cell.data("currentValue") || cell.text();
		var parsed;
		if(parser){
			parsed = parser(cell,cell.parent("tr").index("tr")-1);
		}
		
		var originalValue = cell.data("originalValue");
		if(typeof originalValue ==="undefined"){
			cell.data("originalValue",fallback);
		}
		
		if(!parsed&&parsed!=0){
			return fallback;
		}else{
			return parsed;
		}
		//return parsed||fallback;

		
	},
	
	getCellData:function(row,column){
		var cell = this.getCell(row,column);
		var data = {};
		data["value"] = this.getCellValue(cell);
		data["originalValue"] = cell.data("originalValue");
		data["columnOrdinal"] =  cell.data("columnOrdinal");
		data["rowOrdinal"] = cell.data("rowOrdinal");
		return data;
		
	},
	/*
	setCellValue(row,column,value)
	setCellValue(rowId,column,value)
	setCellValue(cellReference,value)
	row (integer) : The Row Order number 1-Base Index (Row 0 is the header)
	rowId (string) : The Row Id
	cellReference (JQuery) :   Object indicating the td cell
	column(integer) : The Column Order Number 1-Base Index
	value(?): the value to be inserted in the cell 
	*/
	setCellValue:function(row,column,value){
		var cell;
		if(row.filter&&row.find&&row[0].tagName==="TD"){
			//cell = row.filter("td").find(":first");
			cell=row;
			value=column;
		}else{
			cell = this.getCell(row,column);
			
		}
		var originalValue = cell.data("originalValue");
		if(typeof originalValue==="undefined"){
			//No original Value? First time I guess...
			cell.data("originalValue",cell.text());
			originalValue=cell.text();
		}
		//ok now I got an originalValue....
		//The cell is Dirty if the original value is diferent from the incomming
		cell.data("dirty",value!=originalValue);
		//finally, set value
		cell.data("currentValue",value);
		cell.text(value);
			
					

		
	},
	
	discardCellChanges:function(row,column){
		var cell = this.getCell(row,column);
		var value = cell.data("originalValue");
		if(typeof value === "undefined"){
			//this.setCellValue(cell,cell.text());
		}else{
			this.setCellValue(cell,value);
		}
	}
	,
	
	getRowCount:function(){
		return this.element.find("tr:not(:has(th))").length; 
		
	},
	
	//REST functions...
	
	_getData:function(id){
		var opts = this.options.ajaxOptions;
		opts.url = this.options.url;
		//the parser is injected as a dataFilter
		opts.dataFilter = this.options.parser;
		opts.context = this;
		opts.success = function(data, textStatus, XMLHttpRequest){
			//console.dir(data);
			this.insertRows(data,data.idField);
			//this._index();
		}
		$.ajax(opts);
	},
	
	_postData:function(){
		
	},
	
	_deleteData:function(id){
		
	},
	
	_putData:function(id){
		
	},
	
	insertUnParsed:function(unparsed,type){
		if(typeof type === "undefined"){
			type = this.options.ajaxOptions.dataType;
		}
		var data = this.options.parser(unparsed,type);

		
		this.insertRows(data,data.idField);
		
	},
	
	insertRows:function(data,id_reference){
		var rows;
		var current_id;
		var ids=[];
		
		if(id_reference){
			if($.isArray(id_reference)){
				ids=id_reference;
			}else if(id_reference["jquery"]){
				ids=id_reference;
			
			}
		}
		
		if(data.data){
			rows=data.data;
		}else if($.isPlainObject(data)||$.isArray(data)){
			rows=data;
		}
		
		for (var i=0; i < rows.length; i++) {
			current_id = this.coalesce(rows[i][id_reference],ids[i],false);
			this.insertRow(rows[i],current_id);
		}
		
	},
	
	refresh:function(){
		this.deleteAllRows();
		this._getData();
		
		
		//1st Get data
		//2nd Parse data
	},
	
	deleteRowById:function(id){
		return getRowById(id);
	},
	
	deleteRowByOrder:function(order){
		return getRowByOrder(order).empty();
	},
	
	deleteAllRows:function(){
		this.element.find("tbody").empty();
	},
	
	insertRow:function(row,id){
		var tr;
		var attached = false;

		if(!id){
			id = "auto_generated_id_".concat(Math.ceil(Math.random()*1000000));
			tr = $("<tr/>",{id:id});
		}else{
			//if id is coming by Row Reference
			if(id.jquery&&id.is("tr")){
				tr=id;
				attached=true;
			}else if(id.tagName && id.tagName==="TR"){
				tr = $(id);
				attached=true;
			}else{
				//check if the row exists
				tr = this.getRowById(id);
				if(!tr.length){
					tr = $("<tr/>",{"id":id});
				}else{
					attached=true;
				}				
			}
		}
		
		//clearup all row data;
		tr.empty();

		var columnNames = this.getColumnNames();
		
		var cell;
		var column;
		var isArray = $.isArray(row);
		
		for (var i=0; i < columnNames.length; i++) {
			
			column = isArray?i:columnNames[i];
			cell = $("<td/>",{"html":"&nbsp;","class":"ui-widget-content"});
			
			if(row[column]){
				this.setCellValue(cell,row[column]);
			}
			tr.append(cell);
		};
		

		if(!attached){
			this.element.find("tbody").append(tr);
		}
		
		this._index();
		
	},
	
	_parseDataIntoTr:function(data,id){


	},
	
	_index:function(){
		var columnNames = this.getColumnNames();
		for (var i=1; i <= columnNames.length; i++) {
			this.getColumn(i).data("columnOrdinal",i);
		};
		var rowCount = this.getRowCount();
		for (var i=1; i <= rowCount; i++) {
			this.getRowByOrder(i).children("td").andSelf().data("rowOrdinal",i);
		};
		
	},
	
	getColumnNames:function(){
		return this.element.find("tr:has(th):first th").map(function(i,e){
			return e.abbr;
		}).get();
	},
	
	editCell:function(row,column){
		var data = this.getCellData(row,column);
		data["gridInstance"]=this;
		var position = this.getCell(row,column).position();
		var width = this.getCell(row,column).innerWidth();
		var height =  this.getCell(row,column).innerHeight();
		var type = this.coalesce(data["editorType"],"default");
		var editor = this.options.editors[type];
		var editingWidget = editor(data).hide().css({
			"position":"absolute",
			"top":position.top,
			"left":position.left,
			"height":height,
			"width":width,
			"padding":"0px",
			"border":"0px",
			"margin":"0px"
		});
		
		var self = this;	
		editingWidget.appendTo("body");
		
		editingWidget.fadeIn("fast").focus().select();
		
	},
	
	endEdit:function(row,column,editor){
		this.setCellValue(row,column,editor.value());
		
	},
	
	_isUndefined:function(test){
		return (typeof test === "undefined");
	},

	//coalesce Funcion. Returns the first non-undefined argument.
	//False, 0 and "" are not considered undefined
	coalesce:function(){
		for (var i=0; i < arguments.length; i++) {
			if(!this._isUndefined(arguments[i])){
				return arguments[i];
			}
		};
		return undefined;
	},
	
	isDeepArray:function(array) {
		if($.isArray(array)&&array.length>0){
			return($.isArray(array[0])||$.isPlainObject(array[0]));
		}
		
	},
	
	row:function(idOrRowNumber,dataOrParameter){
		//this function should know its mode by the following:
		// if idOrRowNumber is String and dataOrParameter is Array|Object -> Create / Update (1|Many Rows)
		// if idOrRowNumber is Array and dataOrParameter is Array|Object -> Create / Update (1|Many Rows)
		// if idOrRowNumber is Array|object and dataOrParameter is Undefined -> Create / Update (1|Many Rows)
		// if idOrRowNumber is String|Array and dataOrParameter is Undefined|String -> Read / Delete / Modify Metadata
		
		//keep reference to ui grid
		var self =this;
		var row;
		
		//If i'm getting an Object as first param, I'm implying the add Parameter
		if($.isPlainObject(idOrRowNumber)){
			dataOrParameter="add";
		}else{
			//The preferred method is by Id...
			row=(this.getRowById(idOrRowNumber));
			if(!row.length){
				//if not found try by order
				row=(this.getRowByOrder(idOrRowNumber));
			}//if row
			
		}

		var returned;
		switch(dataOrParameter){
			case "add":
				//Data is Coming in Array Format
				if($.isArray(idOrRowNumber) && idOrRowNumber.length>0){
					var first = idOrRowNumber[0];
					//data has more than 1 row (more than 1 dimension)
					if($.isArray(first)||$.isPlainObject(first)){
						this.insertRows(idOrRowNumber);
					}else{
						//Only 1 row array
						this.insertRow(idOrRowNumber);
					}
				}else{
					if($.isPlainObject(idOrRowNumber)){
						this.insertRow(idOrRowNumber);
					}
				}
							
				break;
			case "array":
				//Build an Array
				returned = row.map(function(i,e){ //For each row
					return $(e).find("td").map(function(ind,ele){//For each cell
						return self.getCellValue($(ele)); 
					}).get();//Return Cell Array
				}).get();///Return Row Array
				break;
			case "object":
				//Build an Object Array, or simple Object
				returned = row.map(function(i,e){
					var object = {};
					var values = $(e).find("td").map(function(ind,ele){
						return self.getCellValue($(ele));
					}).get();
					
					var columnNames = self.getColumnNames();
					for (var i=0; i < columnNames.length; i++) {
						object[columnNames[i]]=values[i];
					};
					
					return object;	
				}).get();
				if(returned.length===1){
					returned = returned[0];
				}
			
				break;	
			case "deep":
			default:
				//Ok Got here, data is an object or an array?
				if($.isPlainObject(dataOrParameter)||$.isArray(dataOrParameter)){
					if(this.isDeepArray(dataOrParameter)){
						this.insertRows(dataOrParameter,row)
						
					}else{
						this.insertRow(dataOrParameter,row);
					}
					
				}else{
					returned = row;	
				}
			
		}//switch dataOrParam
		
		return returned;
}
	
	
});
//core functions	
	
	
})(jQuery)