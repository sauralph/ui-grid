;(function($){

$.widget( "ui.grid", {
	options:{
		titleBar:true,
		footerBar:true
		
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
		
		buttons.append($("<a/>",{text:"< Previous"}).button({text:false,icons:{primary:"ui-icon-triangle-1-w"}}));
		buttons.append($("<a/>",{text:"Add"}).button({icons:{primary:"ui-icon-plus"}}));
		buttons.append($("<a/>",{text:"Remove"}).button({icons:{primary:"ui-icon-trash"}}));
		buttons.append($("<a/>",{text:"Refresh"}).button({icons:{primary:"ui-icon-refresh"}}));
		buttons.append($("<a/>",{text:"Next >"}).button({text:false,icons:{primary:"ui-icon-triangle-1-e"}}))
		
		buttons.buttonset();
		
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
		this.menu.append($("<li/>").append($("<a/>",{text:"Order Ascending"})));
		this.menu.append($("<li/>").append($("<a/>",{text:"Order Descending"})));
		this.menu.append($("<li/>").append($("<a/>",{text:"Filter by this field..."})));
		this.menu.append($("<li/>").append($("<a/>",{text:"Group by this field..."})));
		
		this.menu.menu().appendTo("body").hide();
		
		table.find("th a").click(function(){
			var position = $(this).position();
			self.menu.css({
				position:'absolute',
				top:position.top+$(this).outerHeight(),
				left:position.left
				});
			self.menu.slideToggle("fast");
		});
		
		
		
		
	}
});
//core functions	
	
	
})(jQuery)