Ext.define("Voyant.utils.Show", {
	statics: {
		show: function(contents) {
			if (this.promise) {
				var showDfd = Voyant.utils.deferredManager.getDeferred();
				$.when(this)
					.done(function(val) {val.show();})
					.always(showDfd.release());
				return showDfd.promise();
			}
			
			// we have at least one argument passed to this function
			if (arguments.length>0) {
				
				// if we have more than one argument, treat them as a single line
				if (arguments.length>1) {
					show("<div class='"+Voyant.utils.Show.MODE+"'>")
					Voyant.utils.Show.SINGLE_LINE_MODE = true;
					for (var i=0;i<arguments.length;i++) {
						arguments[i].show.call(arguments[i]);
					}
					Voyant.utils.Show.SINGLE_LINE_MODE = false;
					show("</div>")
				}
				
				// otherwise, process normally
				else {
					arguments[0].show.call(arguments[0]);
				}
			}
			
			// not a promise, no arguments, so try showing the actual object
			else {
				var contents = contents || (this==window ? '[empty]' : this);
				if (Voyant.utils.Show.TARGET) {
					if (Voyant.utils.Show.SINGLE_LINE_MODE==false) {contents="<div class='"+Voyant.utils.Show.MODE+"'>"+contents+"</div>";}
					if (Voyant.utils.Show.TARGET.insertHtml) {
						Voyant.utils.Show.TARGET.insertHtml('beforeEnd',contents);
					} 
					else if (Voyant.utils.Show.TARGET.innerHTML) {
						Voyant.utils.Show.TARGET.innerHTML=Voyant.utils.Show.TARGET.innerHTML+contents;
					}
				}
				else {
					Ext.Msg.show({
					    msg: contents,
					    buttons: Ext.Msg.OK,
					    icon: Voyant.utils.Show.MODE=='error' ? Ext.window.MessageBox.ERROR : Ext.window.MessageBox.INFO
					})
				}
			}
		},
		showError: function(error, more) {
			var mode = Voyant.utils.Show.MODE;
			Voyant.utils.Show.MODE='error';
			if (error.stack && !more) {more=error.stack}
			if (more && Ext.isString(more)==false) {more=more.toString()}
			if (more) {
				if (console) {console.error(error,more);}
				var id = Ext.data.IdGenerator.get('uuid').generate();
				error=error.toString()+" <input type='button' onclick='$(\"#"+id+"\").show();$(this).hide()' value='+' /><pre id='"+id+"' style='display: none;'> "+more+'</pre>';
			}
			else {
				if (console) {console.error(error)}
			}
			show(error);
			Voyant.utils.Show.MODE = mode;
		},
		TARGET : null,
		MODE: 'info',
		SINGLE_LINE_MODE : false
	}
})

// alias show(contents) as global
show = Voyant.utils.Show.show;
Number.prototype.show = show
String.prototype.show = show;
Boolean.prototype.show = show;
Array.prototype.show = show;
//Object.prototype.show = show;
showError = Voyant.utils.Show.showError
Ext.Error.prototype.show = show;