Ext.define("Voyant.data.store.Documents", {
	extend: "Ext.data.Store",
	model: "Voyant.data.model.Document",
	config: {
		corpus: undefined
	},
    statics: {
    	i18n: {
    		failedGetDocuments: {en: 'Failed attempt to get documents.'}
    	}
    },
	sorters: {
        property: 'title',
        direction: 'DESC'
	},
	remoteSort: true,
	constructor : function(config) {
		// create proxy in constructor so we can set the Trombone URL
		Ext.apply(config, {
		     proxy: {
		         type: 'ajax',
		         url: Voyant.application.getTromboneUrl(),
		         extraParams: {
		        	 tool: 'corpus.DocumentsMetadata',
		        	 corpus: config && config.corpus ? (Ext.isString(config.corpus) ? config.corpus : config.corpus.getId()) : undefined
		         },
		         reader: {
		             type: 'json',
		             rootProperty: 'documentsMetadata.documents'
		         },
		         simpleSortMode: true
		     },
	         listeners: {
	        	 load: function(store, records, successful, opts) {
	        		 var corpus = store.getCorpus();
	        		 records.forEach(function(record) {
	        			 record.set('corpus', corpus);
	        		 })
	        	 }
	         }
		})
		this.callParent([config]);
	},
	setCorpus: function(corpus) {
		if (corpus) {
			this.getProxy().setExtraParam('corpus', Ext.isString(corpus) ? corpus : corpus.getId());
		}
		this.callParent(arguments);
	},
	
	getDocument: function(config) {
		if (this.getCorpus().getDocumentsCount()!=this.getTotalCount()) {
			var dfd = Voyant.application.getDeferred();
			var me = this;
			this.load({
			    scope: this,
			    callback: function(records, operation, success) {
			    	if (success) {dfd.resolve(this.getDocument(config))}
			    	else {
						Voyant.application.showResponseError(this.localize('failedGetDocuments'), response);
						dfd.reject(); // don't send error since we've already shown it
			    	}
			    }
			})
			return dfd.promise()
		}
		return Ext.isNumber(config) ? this.getAt(config) : this.getById(config);
	}
})