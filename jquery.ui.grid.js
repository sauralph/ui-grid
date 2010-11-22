;(function($){

$.widget( "ui.grid", {
	options:{
		localSorting:false,
		titleBar:true,
		footerBar:true,
		buttons:{
			"< Previous":{text:false,icons:{primary:"ui-icon-triangle-1-w"}},
			"Add":{icons:{primary:"ui-icon-plus"}},
			"Remove":{icons:{primary:"ui-icon-trash"}},
			"Refresh":{icons:{primary:"ui-icon-refresh"}},
			"Next >":{text:false,icons:{primary:"ui-icon-triangle-1-e"}}
		},
		sort:{	
			"default" : function(a,b){
				return a.value - b.value;
			},

			"reverse" : function(a,b){
				return b.value-a.value;
			}

		}	
	},
	_create:function(){
		var self = this;
		var table = this.element;
		// if(table.attr("tag")!=="table"){
		// 	table = table.find("table")
		// }
		
		//build wrapper
		table.wrap($("<div/>",{class:"ui-grid ui-widget ui-widget-content ui-corner-all"}));
		
		//build title
		
		table.before($("<div/>",{text:table.find("caption").hide().text(),class:"ui-grid-header ui-widget-header ui-corner-top"}));
		
		//build footer
		var buttons = $("<div/>",{class:"ui-grid-paging ui-helper-clearfix"});
		
		if(this.options.buttons){
			for(name in this.options.buttons){
				buttons.append($("<a/>",{text:name}).button(this.options.buttons[name]));
			}
			buttons.buttonset();	
		}
		

		
		
		var results = $("<div/>",{class:"ui-grid-results"});
		var footer  = $("<div/>",{
			text:table.attr("summary"),
			class:"ui-grid-footer ui-widget-header ui-corner-bottom ui-helper-clearfix"
			}).wrapInner(results).prepend(buttons);
			
		table.after(footer);
		
		//applying to table
		
		table.addClass("ui-grid-content ui-widget-content");
		
		//styling TH
		
		table.find("th").addClass("ui-state-default").wrapInner($("<a/>",{href:"#"})).find("a").prepend($("<span>",{class:"ui-icon ui-icon-triangle-1-s"}));
		
		//styling regular Cells
		
		table.find("td").addClass("ui-widget-content");
		
		//registring behaviour for rows
		
		table.find("tr:has(td)")
		.hover(
			function(){ $('td', this).addClass('ui-state-hover');},
			function(){ $('td', this).removeClass('ui-state-hover');}
		)
		.toggle(
			function(){ $('td', this).addClass('ui-state-highlight');},
			function(){ $('td', this).removeClass('ui-state-highlight');}
		);
		
		//building menu
		this.menu = $( "<ul/>" );
		this.menu.append($("<li/>",{style:"cursor:pointer;"}).append($("<a/>",{data:{command:function(c){self.sort(c,"default")}},text:"Order Ascending"})));
		this.menu.append($("<li/>",{style:"cursor:pointer;"}).append($("<a/>",{data:{command:function(c){self.sort(c,"reverse")}},text:"Order Descending"})));
		this.menu.append($("<li/>",{style:"cursor:pointer;"}).append($("<a/>",{data:{command:function(c){alert(c+" Placeholder!")}},text:"Filter by this field..."})));
		this.menu.append($("<li/>",{style:"cursor:pointer;"}).append($("<a/>",{data:{command:function(c){alert(c+" Placeholder!")}},text:"Group by this field..."})));
		
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
				fn = this.options.sort.default;
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
		
		
	},
	
	getColumn:function(column){
		if(isNaN(column)||column===0){
			column=1;
		}
		return this.element.find("tr td:nth-child("+column+")"); 
	},
	
	getColumnValues:function(column,parser){
		var set = this.getColumn(column);
		
		if(typeof parser ==="undefined"){
			parser = function(input,index){
				return $(input).text();
			}
		}
		
		return set.map(function(i,e){ return parser(e,i) }).get();
		
	},
	
	getCell:function(row,column){
		return this.element.find("tr:nth-child("+row+") td:nth-child("+column+")"); 
	},
	
	getCellValue:function(row,column,parser){
		if(typeof parser ==="undefined"){
			parser = function(input){
				return input;
			}
		}
		return parser(this.getCell(row,column).text()); 
	},
	
	setCellValue:function(row,column,value){
		return this.getCell(row,column).text(value);
	},
	
	getRowCount:function(){
		return this.element.find("tr:not(:has(th))").length; 
		
	}
	
});
//core functions	
	
	
})(jQuery)