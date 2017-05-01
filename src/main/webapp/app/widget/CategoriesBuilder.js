Ext.define('Voyant.widget.CategoriesOption', {
	extend: 'Ext.container.Container',
	mixins: ['Voyant.util.Localization'],
	alias: 'widget.categoriesoption',
	statics: {
		i18n: {
			categories: 'Categories',
			edit: 'Edit'
		}
	},
	config: {
		builderWin: undefined
	},
	initComponent: function() {
		var value = this.up('window').panel.getApiParam('categories');
    	var data = value ? [{name: 'categories-'+value, value: value}] : [];
		
		Ext.apply(this, {
    		layout: 'hbox',
    		items: [{
    			xtype: 'combo',
    			queryMode: 'local',
    			triggerAction: 'all',
    			fieldLabel: this.localize('categories'),
    			labelAlign: 'right',
    			displayField: 'name',
    			valueField: 'value',
    			store: {
    				fields: ['name', 'value'],
    				data: data
    			},
    			name: 'category'
    		}, {width: 10}, {xtype: 'tbspacer'}, {
    			xtype: 'button',
    			text: this.localize('edit'),
    			ui: 'default-toolbar',
    			handler: function() {
    				if (this.getBuilderWin() === undefined) {
    					var panel = this.up('window').panel;
    					var win = Ext.create('Voyant.widget.CategoriesBuilder', {
    						panel: panel,
    						categoriesManager: panel.getApplication().getCategoriesManager(),
    						height: panel.getApplication().getViewport().getHeight()*0.75,
    						width: panel.getApplication().getViewport().getWidth()*0.75
    					});
    					win.on('close', function(win) {
    						var id = win.getCategoriesId();
    						if (id !== undefined) {
	    						var combo = this.down('combo');
								var name = 'categories-'+id;
								combo.getStore().add({name: name, value: id});
								combo.setValue(id);
								
								this.up('window').panel.setApiParam('categories', id);
    						}
    					}, this);
    					this.setBuilderWin(win);
    				}
    				
    				var categoriesId = this.down('combo').getValue();
    				this.getBuilderWin().setCategoriesId(categoriesId);
					this.getBuilderWin().show();
    			},
    			scope: this
    		}]
    	});
		
		this.callParent(arguments);
	}
});

Ext.define('Voyant.widget.CategoriesBuilder', {
    extend: 'Ext.window.Window',
    requires: ['Voyant.widget.FontFamilyOption'],
    mixins: ['Voyant.util.Localization','Voyant.util.Api','Voyant.util.CategoriesManager'],
    alias: 'widget.categoriesbuilder',
    statics: {
    	i18n: {
    		title: 'Categories Builder',
    		terms: 'Terms',
    		term: 'Term',
    		rawFreq: 'Count',
    		relativeFreq: 'Relative',
    		categories: 'Categories',
    		addCategory: 'Add Category',
    		removeCategory: 'Remove Category',
    		removeTerms: 'Remove Selected Terms',
    		categoryName: 'Category Name',
    		add: 'Add',
    		cancel: 'Cancel',
    		exists: 'Category already exists',
    		confirmRemove: 'Are you sure you want to remove the category?',
    		save: 'Save',
    		cancel: 'Cancel',
    		features: 'Features',
    		category: 'Category',
    		color: 'Color',
    		font: 'Font'
    	},
    	api: {
    		stopList: 'auto',
    		query: undefined
    	},
    	features: {
        	color: {
        		xtype: 'colorfield',
        		format: '#hex6'
        	},
        	font: {
        		xtype: 'combobox',
        		queryMode: 'local',
        		displayField: 'name',
        		valueField: 'value',
        		store: {
        			fields: ['name', 'value'],
        			data: Voyant.widget.FontFamilyOption.fonts
        		}
        	}
        }
    },
    config: {
    	corpus: undefined,
    	categoriesManager: undefined,
    	builderWin: undefined,
    	addCategoryWin: undefined,
    	categoriesId: undefined
    },
    
    // window defaults
    closeAction: 'hide',
    modal: true,
	height: 250,
	width: 500,

    constructor: function(config) {
    	config = config || {};
    	
    	if (config.panel) {
    		this.panel = config.panel;
    	} else {
    		if (window.console) {
    			console.warn('can\'t find panel!');
    		}
    	}
    	
    	var categoriesManager = config.categoriesManager ? config.categoriesManager : Ext.create('Voyant.util.CategoriesManager');
    	this.setCategoriesManager(categoriesManager);
    	
    	this.mixins['Voyant.util.Api'].constructor.apply(this, arguments);
    	this.callParent(arguments);
    },
    
    initComponent: function() {
    	Ext.apply(this, {
    		header: false,
    		layout: 'fit',
    		items: {
	    		xtype: 'tabpanel',
	    		title: this.localize('title'),
	    		tabBarHeaderPosition: 1,
	    		items: [{
		    		layout: 'border',
		    		title: this.localize('categories'),
		    		items: [{
		    			title: this.localize('terms'),
		    			split: true,
		    			width: 250,
		    			region: 'west',
		    			layout: 'fit',
		    			items: {
		    				itemId: 'terms',
		    				xtype: 'grid',
		    				store: Ext.create('Voyant.data.store.CorpusTermsBuffered', {
		    		        	parentPanel: this
		    		        }),
		    				viewConfig: {
		    					plugins: {
		    						ptype: 'gridviewdragdrop',
		    						ddGroup: 'terms',
		    						copy: true,
		    						enableDrop: false, // can't drop on grid with buffered store
		    						dragZone: {
		    							getDragText: function() {
		    								var text = '';
		    								this.dragData.records.forEach(function(d) {
		    									text += d.get('term')+', ';
		    								});
		    								return text.substr(0, text.length-2);
		    							}
		    						}
		    					}
		    				},
		    				selModel: {
		    	    			mode: 'MULTI'
		    	    		},
		    				columns: [{
				    			text: this.localize('term'),
				        		dataIndex: 'term',
				        		flex: 1,
				                sortable: true
				            },{
				            	text: this.localize('rawFreq'),
				            	dataIndex: 'rawFreq',
				                width: 'autoSize',
				            	sortable: true
				            },{
				            	text: this.localize('relativeFreq'),
				            	dataIndex: 'relativeFreq',
				            	renderer: function(val) {
				            		return Ext.util.Format.number(val*1000000, "0,000");
				            	},
				                width: 'autoSize',
				                hidden: true,
				            	sortable: true
				            }],
				            dockedItems: [{
				                dock: 'bottom',
				                xtype: 'toolbar',
				                overflowHandler: 'scroller',
				                items: [{
				                    xtype: 'querysearchfield'
				                }]
				            }],
				            listeners: {
				            	query: function(src, query) {
				            		this.setApiParam('query', query);
				            		var store = this.queryById('terms').getStore();
				            		store.removeAll();
				            		store.load();
				            	},
				            	scope: this
				            }
		    			}
		    		},{
		    			title: this.localize('categories'),
		    			itemId: 'categories',
		    			region: 'center',
		    			xtype: 'panel',
		    			layout: {
		    				type: 'hbox',
		    				align: 'stretch'
		    			},
		    			scrollable: 'x',
		    			dockedItems: [{
		                    dock: 'bottom',
		                    xtype: 'toolbar',
		                    overflowHandler: 'scroller',
		                    items: [{
		                    	text: this.localize('addCategory'),
		                    	handler: function() {
		                    		this.getAddCategoryWin().show();
		                    	},
		                    	scope: this
		                    },{
		                    	text: this.localize('removeTerms'),
		                    	handler: function() {
		                    		this.queryById('categories').query('grid').forEach(function(grid) {
		                    			grid.getStore().remove(grid.getSelection());
		                    		}, this);
		                    	},
		                    	scope: this
		                    }]
		    			}],
		    			items: []
		    		}]
	    		},{
	    			layout: 'fit',
	    			itemId: 'features',
	    			title: this.localize('features'),
	    			xtype: 'grid',
	    			scrollable: 'y',
	    			store: Ext.create('Ext.data.JsonStore', {
		    			fields: ['category']
		    		}),
	    			columns: [{
	    				text: this.localize('category'),
	    				dataIndex: 'category',
	    				sortable: false,
	    				hideable: false,
	    				flex: 1
	    			}]
	    		}]
    		},
    		buttons: [{
				text: this.localize('cancel'),
				handler: function(btn) {
					this.setCategoriesId(undefined);
					btn.up('window').close();
				},
				scope: this
			},{
				text: this.localize('save'),
				handler: function(btn) {
					this.setColorTermAssociations();
					this.saveData(this.getCategoriesManager().getExportData()).then(function(id) {
						this.setCategoriesId(id);
						btn.up('window').close();
					}, function() {
						this.setCategoriesId(undefined);
						btn.up('window').close();
					}, null, this);
				},
				scope: this
			}],
			listeners: {
				show: function() {
					if (this.getCategoriesId()) {
		    			this.loadData(this.getCategoriesId()).then(function(data) {
							this.getCategoriesManager().setCategories(data.categories);
							this.getCategoriesManager().setFeatures(data.features);
							this.buildCategories();
							this.buildFeatures();
						}, null, null, this);
	    			} else {
	    				this.buildCategories();
	    				this.buildFeatures();
	    			}
				},
				afterrender: function(builder) {
					builder.on('loadedCorpus', function(src, corpus) {
		    			this.setCorpus(corpus);
			    		var terms = this.queryById('terms');
			    		terms.getStore().load();
		    		}, builder);
		    		
					this.panel.on('loadedCorpus', function(src, corpus) {
	    				builder.fireEvent('loadedCorpus', src, corpus);
	    			}, builder);
	    			if (this.panel.getCorpus && this.panel.getCorpus()) {builder.fireEvent('loadedCorpus', builder, this.panel.getCorpus());}
	    			else if (this.panel.getStore && this.panel.getStore() && this.panel.getStore().getCorpus && this.panel.getStore().getCorpus()) {
	    				builder.fireEvent('loadedCorpus', builder, this.panel.getStore().getCorpus());
	    			}
		    		
	    			this.addFeature('font');
		    		this.addFeature('color');
				},
				scope: this
			}
    	});
    	
    	this.setAddCategoryWin(Ext.create('Ext.window.Window', {
    		title: this.localize('addCategory'),
    		modal: true,
    		closeAction: 'hide',
    		layout: 'fit',
    		items: {
    			xtype: 'form',
    			width: 300,
    			defaults: {
    				labelAlign: 'right'
    			},
	    		items: [{
	    			xtype: 'textfield',
	    			fieldLabel: this.localize('categoryName'),
	    			name: 'categoryName',
	    			allowBlank: false,
	    			validator: function(val) {
	    				return this.getCategoriesManager().getCategoryTerms(val) === undefined ? true : this.localize('exists');
	    			}.bind(this),
	    			enableKeyEvents: true,
	    			listeners: {
	    				keypress: function(field, evt) {
	    					if (evt.getKey() === Ext.event.Event.ENTER) {
	    						field.up('form').queryById('addCategoryButton').click();
	    					}
	    				},
	    				scope: this
	    			}
	    		}],
	    		buttons: [{
	    			text: this.localize('cancel'),
	    			handler: function(btn) {
	    				btn.up('window').close();
	    			}
	    		},{
	    			itemId: 'addCategoryButton',
	    			text: this.localize('add'),
	    			handler: function(btn) {
	    				var form = btn.up('form');
	    				if (form.isValid()) {
	    					var name = form.getValues()['categoryName'];
	    					this.addCategory(name);
	    					btn.up('window').close();
	    				}
	    			},
	    			scope: this
	    		}]
    		},
    		listeners: {
    			show: function(win) {
    				var form = win.down('form').getForm();
    				form.reset();
					form.clearInvalid();
    			}
    		}
    	}));
    	
    	this.callParent(arguments);
    },
    
    addCategory: function(name) {
    	this.getCategoriesManager().addCategory(name);
    	
    	this.queryById('features').getStore().add({category: name});

    	var termsData = [];
    	var terms = this.getCategoriesManager().getCategoryTerms(name);
    	if (terms !== undefined) {
    		for (var i = 0; i < terms.length; i++) {
    			termsData.push({term: terms[i]});
    		}
    	}
    	
    	var grid = this.queryById('categories').add({
    		xtype: 'grid',
    		category: name,
    		title: name,
//    		header: {
//    			items: [{
//    				xtype: 'colorbutton',
//    				format: '#hex6',
//    				value: color,
//    				width: 30,
//    				height: 15,
//    				listeners: {
//    					change: function(btn, color, pcolor) {
//    						this.getCategoriesManager().setCategoryFeature(name, 'color', color);
//    					},
//    					afterrender: function(btn) {
//    						var popup = btn.getPopup();
//    						popup.listeners = {
//    							focusleave: function(sel, evt) {
//    								sel.close(); // fix for conflict between selector and parent modal window, when you click outside of the selector
//    							}
//    						};
//    					},
//    					scope: this
//    				}
//    			}]
//    		},
    		frame: true,
    		width: 150,
    		margin: '10 0 10 10',
    		layout: 'fit',
    		tools: [{
    			type: 'close',
    			tooltip: this.localize('removeCategory'),
    			callback: function(panel) {
    				Ext.Msg.confirm(this.localize('removeCategory'), this.localize('confirmRemove'), function(btn) {
    					if (btn === 'yes') {
    						this.removeCategory(name);
    					}
    				}, this);
    			},
    			scope: this
    		}],
    		
    		store: Ext.create('Ext.data.JsonStore', {
    			data: termsData,
    			fields: ['term']
    		}),
    		viewConfig: {
	    		plugins: {
	    			ptype: 'gridviewdragdrop',
					ddGroup: 'terms',
					dragZone: {
						getDragText: function() {
							var text = '';
							this.dragData.records.forEach(function(d) {
								text += d.get('term')+', ';
							});
							return text.substr(0, text.length-2);
						}
					}
	    		}
    		},
    		selModel: {
    			mode: 'MULTI'
    		},
    		columns: [{
        		dataIndex: 'term',
        		flex: 1,
                sortable: true
            }],
    		listeners: {
    			beforedrop: function(node, data) {
    				// remove duplicates
    				var categories = this.up('categoriesbuilder').getCategoriesManager();
    				for (var i = data.records.length-1; i >= 0; i--) {
    					var term = data.records[i].get('term');
    					if (categories.getCategoryForTerm(term) !== undefined) {
    						data.records.splice(i, 1);
    					}
    				}
    			},
    			drop: function(node, data) {
    				data.view.getSelectionModel().deselectAll();
    				this.getSelectionModel().deselectAll();
    				
    				var categories = this.up('categoriesbuilder').getCategoriesManager();
    				var terms = [];
    				for (var i = 0; i < data.records.length; i++) {
    					var term = data.records[i].get('term');
    					if (categories.getCategoryForTerm(term) === undefined) {
    						terms.push(term);
    					}
    				}
    				categories.addTerms(name, terms);
    				
    				var source = data.view.up('grid');
    				if (source.category) {
    					categories.removeTerms(source.category, terms);
    				}
    			}
    		}
    	});
    	
    	var titleEditor = new Ext.Editor({
    		updateEl: true,
    		alignment: 'l-l',
    		autoSize: {
    			width: 'boundEl'
    		},
    		field: {
    			xtype: 'textfield',
    			allowBlank: false,
    			validator: function(val) {
    				return this.getCategoriesManager().getCategoryTerms(val) === undefined || val ===  grid.getTitle() ? true : this.localize('exists');
    			}.bind(this)
    		},
    		listeners: {
//    			beforecomplete: function(ed, newvalue, oldvalue) {
//    				this.up('categoriesbuilder').getCategoriesManager().getCategoryTerms(newvalue);
//    			},
    			complete: function(ed, newvalue, oldvalue) {
    				this.getCategoriesManager().renameCategory(oldvalue, newvalue);
    				this.buildFeatures();
    			},
    			scope: this
    		}
    	});
    	
    	grid.header.getTitle().textEl.on('dblclick', function(e, t) {
    		titleEditor.startEdit(t);
    	});
    },
    
    removeCategory: function(name) {
    	var categoriesParent = this.queryById('categories');
    	var panel = categoriesParent.queryBy(function(cmp) {
    		if (cmp.category && cmp.category == name) {
    			return true;
    		}
    		return false;
    	});
    	categoriesParent.remove(panel[0]);
    	
    	var featuresStore = this.queryById('features').getStore();
    	featuresStore.removeAt(featuresStore.findExact('category', name));
    	
		this.getCategoriesManager().removeCategory(name);
    },
    
    addFeature: function(name) {
		this.getCategoriesManager().addFeature(name);
		this.buildFeatures();
    },
    
    buildFeatures: function() {
    	this.queryById('features').getStore().removeAll();
    	
    	var fields = ['category'];
		var columns = [{
			sortable: false,
			text: this.localize('category'),
			dataIndex: 'category',
			flex: 1
		}];
		var data = [];
		
		var catman = this.getCategoriesManager();
		for (var category in catman.getCategories()) {
			data.push({category: category});
		}
		
		var features = catman.getFeatures();
		var featuresConfig = Ext.ClassManager.getClass(this).features;
		
		for (var feature in features) {
			fields.push(feature);
			
			var widgetConfig = Ext.apply({
				feature: feature,
				listeners: {
					change: function(cmp, newvalue) {
						if (cmp.rendered) {
							var rowIndex = cmp.up('gridview').indexOf(cmp.el.up('table'));
							var category = cmp.up('grid').getStore().getAt(rowIndex).get('category');
							this.getCategoriesManager().setCategoryFeature(category, cmp.feature, newvalue);
						}
					},
					scope: this
				}
			}, featuresConfig[feature]);
			
			columns.push({
				sortable: false,
				hideable: false,
				text: this.localize(feature),
				dataIndex: feature,
				flex: 0.5,
				xtype: 'widgetcolumn',
				widget: widgetConfig
			});
			
			for (var category in catman.getCategories()) {
				var value = catman.getCategoryFeature(category, feature);
				for (var i = 0; i < data.length; i++) {
					if (data[i].category == category) {
						data[i][feature] = value;
						break;
					}
				}
			}
		}
		
		var store = Ext.create('Ext.data.JsonStore', {
			fields: fields,
			data: data
		});
		this.queryById('features').reconfigure(store, columns);
    },
    
    buildCategories: function() {
    	this.queryById('categories').removeAll();
    	
    	var cats = this.getCategoriesManager().getCategories();
    	for (var key in cats) {
    		this.addCategory(key);
    	}
    },
    
    loadData: function(id) {
		var dfd = new Ext.Deferred();
		
		var panel = this.panel;
		Ext.Ajax.request({
			url: panel.getTromboneUrl(),
			params: {
				tool: 'resource.StoredResource',
                retrieveResourceId: id,
                failQuietly: true
			}
		}).then(function(response) {
        	var json = Ext.decode(response.responseText);
        	var id = json.storedResource.id;
        	var value = json.storedResource.resource;
        	if (value.length == 0) {
        		dfd.reject();
        	} else {
        		value = Ext.decode(value);
        		dfd.resolve(value);
        	}
        }, function() {
        	dfd.reject();
        }, null, this);
		
		return dfd.promise;
	},
	
	saveData: function(data) {
		var dfd = new Ext.Deferred();
		
		var dataString = Ext.encode(data);
		var panel = this.panel;
		Ext.Ajax.request({
            url: panel.getTromboneUrl(),
            params: {
                tool: 'resource.StoredResource',
                storeResource: dataString
            }
        }).then(function(response) {
        	var json = Ext.util.JSON.decode(response.responseText);
        	var id = json.storedResource.id;
            dfd.resolve(id);
        }, function(response) {
            dfd.reject();
        });
		
		return dfd.promise;
	},
    
    setColorTermAssociations: function() {
		var app = this.panel.getApplication();
		var catman = this.getCategoriesManager();
		for (var category in catman.getCategories()) {
			var color = catman.getCategoryFeature(category, 'color');
			if (color !== undefined) {
				var rgb = app.hexToRgb(color);
				var terms = catman.getCategoryTerms(category);
				for (var i = 0; i < terms.length; i++) {
					app.colorTermAssociations.replace(terms[i], rgb);
				}
			}
		}
    }
});