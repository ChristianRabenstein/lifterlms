/**
 * LifterLMS Admin Panel Metabox Functions
 * @since  3.0.0
 */
( function( $ ) {


	$.fn.llmsCollapsible = function() {

		var $group = this;

		this.on( 'click', '.llms-collapsible-header', function() {

			var $parent = $( this ).closest( '.llms-collapsible' ),
				$siblings = $parent.siblings( '.llms-collapsible' );

			$parent.toggleClass( 'opened' );

			$parent.find( '.llms-collapsible-body' ).slideToggle( 400 );

			$siblings.each( function() {
				$( this ).removeClass( 'opened' );
				$( this ).find( '.llms-collapsible-body' ).slideUp( 400 );
			} );

		} );

		return this;

	};

	window.llms = window.llms || {};

	var Metaboxes = function() {

		/**
		 * Initialize
		 * @return void
		 * @since  3.0.0
		 */
		this.init = function() {

			var self = this;

			// regularly initialize select2 with no options or options passed via data-attrs
			$( '.llms-select2' ).llmsSelect2( {
				width: '100%',
			} );

			$( '.llms-select2-post' ).each( function() {
				self.post_select( $( this ) );
			} );

			$( '.llms-collapsible-group' ).llmsCollapsible();

			this.bind_tabs();

			// bind all datepickers if datepickers exist
			if ( $( '.llms-datepicker' ).length ) {
				this.bind_datepickers();
			}

			if ( $( 'input[type="checkbox"][data-controls]' ).length ) {
				this.bind_cb_controllers();
			}

			if ( $( '[data-is-controller]' ).length ) {
				this.bind_controllers();
			}

			if ( $( '.llms-table' ).length ) {
				this.bind_tables();
			}

			// if a post type is set & a bind exists for it, bind it
			if ( window.llms.post.post_type ) {

				var func = 'bind_' + window.llms.post.post_type;

				if ( 'function' === typeof this[func] ) {

					this[func]();

				}

			}

			if ( $( '.llms-merge-code-button' ).length ) {
				this.bind_merge_code_buttons();
			}

		};

		/**
		 * Bind checkboxes that control the display of other elements
		 * @since 3.0.0
		 * @return void
		 */
		this.bind_cb_controllers = function() {

			$( 'input[type="checkbox"][data-controls]' ).each( function() {

				var $cb = $( this ),
					$controlled = $( $cb.attr( 'data-controls' ) ).closest( '.llms-mb-list' );

				$cb.on( 'change', function() {

					if ( $( this ).is( ':checked' ) ) {

						$controlled.slideDown( 200 );

					} else {

						$controlled.slideUp( 200 );

					}

				} );

				$cb.trigger( 'change' );

			} );

		};

		/**
		 * Bind elements that control the display of other elements
		 * @since 3.0.0
		 * @return void
		 */
		this.bind_controllers = function() {

			$( '[data-is-controller]' ).each( function() {

				var $el = $( this ),
					$controlled = $( '[data-controller="#' + $el.attr( 'id' ) + '"]' ),
					val;

				$el.on( 'change', function() {

					if ( 'checkbox' === $el.attr( 'type' ) ) {

						val = $el.is( ':checked' ) ? $el.val() : 'false';

					} else {

						val = $el.val();

					}

					$controlled.each( function() {

						var possible = $( this ).attr( 'data-controller-value' ),
							vals = [];

						if ( -1 !== possible.indexOf( ',' ) ) {

							vals = possible.split( ',' );

						} else {

							vals.push( possible );

						}


						if ( -1 !== vals.indexOf( val ) ) {

							$( this ).slideDown( 200 );

						} else {

							$( this ).slideUp( 200 );

						}

					} );


				} );

				$el.trigger( 'change' );

			} );

		};


		/**
		 * Bind all LifterLMS datepickers
		 * @return void
		 * @since  3.0.0
		 */
		this.bind_datepickers = function() {

			$('.llms-datepicker').datepicker( {
				dateFormat: "mm/dd/yy"
			} );

		};


		/**
		 * Bind Engagement post type JS
		 * @return   void
		 * @since    3.1.0
		 * @version  3.1.0
		 */
		this.bind_llms_engagement = function() {

			var self = this;

			// when the engagement type changes we need to do some things to the UI
			$( '#_llms_engagement_type' ).on( 'change', function() {

				$( '#_llms_engagement' ).trigger( 'llms-engagement-type-change', $( this ).val() );

			} );

			// custom trigger when called when the engagement type changs
			$( '#_llms_engagement' ).on( 'llms-engagement-type-change', function( e, engagement_type ) {

				var $select = $( this );

				switch ( engagement_type ) {

					/**
					 * core engagements related to a CPT
					 */
					case 'achievement':
					case 'certificate':
					case 'email':

						var cpt = 'llms_' + engagement_type;

						$select.val( null ).attr( 'data-post-type', cpt ).trigger( 'change' );
						self.post_select( $select );

					break;

					/**
					 * Allow other plugins and developers to hook into the engagement type change action
					 */
					default:

						$select.trigger( 'llms-engagement-type-change-external', engagement_type );

				}

			} );

		};

		/**
		 * Actions for memberships
		 * @return   void
		 * @since    3.0.0
		 * @version  3.0.0
		 */
		this.bind_llms_membership = function() {

			$( 'a[href="#llms-course-remove"]' ).on( 'click', function( e ) {

				e.preventDefault();

				var $el = $( this ),
					$row = $el.closest( 'tr' ),
					$container = $el.closest( '.llms-mb-list' );

				LLMS.Spinner.start( $container );

				window.LLMS.Ajax.call( {
					data: {
						action: 'membership_remove_auto_enroll_course',
						course_id: $el.attr( 'data-id' ),
					},
					beforeSend: function() {

						$container.find( 'p.error' ).remove();

					},
					success: function( r ) {

						if ( r.success ) {

							$row.fadeOut( 200 );
							setTimeout( function() {
								$row.remove();
							}, 400 );

						} else {

							$container.prepend( '<p class="error">' + r.message + '</p>' );

						}

						LLMS.Spinner.stop( $container );
					},
				} );


			} );

		};

		/**
		 * Actions for ORDERS
		 * @return   void
		 * @since    3.0.0
		 * @version  3.0.0
		 */
		this.bind_llms_order = function() {

			$( 'button[name="llms-refund-toggle"]' ).on( 'click', function() {

				var $btn = $( this ),
					$row = $btn.closest( 'tr' ),
					txn_id = $row.attr( 'data-transaction-id' ),
					refundable_amount = $btn.attr( 'data-refundable' ),
					gateway_supports = ( '1' === $btn.attr( 'data-gateway-supports' ) ) ? true : false,
					gateway_title = $btn.attr( 'data-gateway' ),
					$new_row = $( '#llms-txn-refund-model .llms-txn-refund-form' ).clone(),
					$gateway_btn = $new_row.find( '.gateway-btn' );

				// configure and add the form
				if ( 'remove' !== $btn.attr( 'data-action' ) ) {

					$btn.text( LLMS.l10n.translate( 'Cancel' ) );
					$btn.attr( 'data-action', 'remove' );
					$new_row.find( 'input' ).removeAttr( 'disabled' );
					$new_row.find( 'input[name="llms_refund_amount"]' ).attr( 'max', refundable_amount );
					$new_row.find( 'input[name="llms_refund_txn_id"]' ).val( txn_id );

					if ( gateway_supports ) {
						$gateway_btn.find( '.llms-gateway-title' ).text( gateway_title );
						$gateway_btn.show();
					}

					$row.after( $new_row );

				} else {

					$btn.text( LLMS.l10n.translate( 'Refund' ) );
					$btn.attr( 'data-action', '' );
					$row.next( 'tr' ).remove();

				}

			} );

			$( 'button[name="llms-manual-txn-toggle"]' ).on( 'click', function() {

				var $btn = $( this ),
					$row = $btn.closest( 'tr' ),
					$new_row = $( '#llms-manual-txn-model .llms-manual-txn-form' ).clone();

				// configure and add the form
				if ( 'remove' !== $btn.attr( 'data-action' ) ) {

					$btn.text( LLMS.l10n.translate( 'Cancel' ) );
					$btn.attr( 'data-action', 'remove' );
					$new_row.find( 'input' ).removeAttr( 'disabled' );

					$row.after( $new_row );

				} else {

					$btn.text( LLMS.l10n.translate( 'Record a Manual Payment' ) );
					$btn.attr( 'data-action', '' );
					$row.next( 'tr' ).remove();

				}

			} );

		};

		/**
		 * Binds custom llms merge code buttons
		 * @return   void
		 * @since    3.1.0
		 * @version  3.1.0
		 */
		this.bind_merge_code_buttons = function() {

			$( '.llms-merge-code-button' ).on( 'click', function() {

				$( this ).next( '.llms-merge-codes' ).toggleClass( 'active' );

			} );

			$( '.llms-merge-codes li' ).on( 'click', function() {

				var $el = $( this ),
					$parent = $el.closest( '.llms-merge-codes' ),
					target = $parent.attr( 'data-target' ),
					code = $el.attr( 'data-code' );

				// dealing with a tinymce instance
				if ( -1 === target.indexOf( '#' ) ) {

					var editor = tinymce.editors[ target ];
					if ( editor ) {
						editor.insertContent( code );
					} // fallback in case we can't access the editor directly
					else {
						alert( LLMS.l10n.translate( 'Copy this code and paste it into the desired area' ) + ': ' + code );
					}

				}
				// dealing with a DOM id
				else {

					$( target ).val( $( target ).val() + code );

				}

				$parent.removeClass( 'active' );

			} );

		};

		/**
		 * Bind metabox tabs
		 * @return   void
		 * @since    3.0.0
		 * @version  3.0.0
		 */
		this.bind_tabs = function() {
			$( '.llms-nav-tab-wrapper .tabs li' ).on( 'click', function() {

				var $btn = $( this ),
					$metabox = $btn.closest( '.llms-mb-container' ),
					tab_id = $btn.attr( 'data-tab' );

				$btn.siblings().removeClass( 'llms-active' );

				$metabox.find( '.tab-content' ).removeClass( 'llms-active' );

				$btn.addClass( 'llms-active' );
				$( '#' + tab_id ).addClass( 'llms-active' );

			} );
		};

		/**
		 * Enable WP Post Table searches for applicable select2 boxes
		 * @since 3.0.0
		 * @version 3.0.0
		 * @return  void
		 */
		this.post_select = function( $el ) {

			var post_type = $el.attr( 'data-post-type' ) || post,
				allow_clear = $el.attr( 'data-post-type' ) || false;

			$el.llmsSelect2( {
				allowClear: allow_clear,
				ajax: {
					dataType: 'JSON',
					delay: 250,
					method: 'POST',
					url: window.ajaxurl,
					data: function( params ) {
						return {
							action: 'select2_query_posts',
							page: ( params.page ) ? params.page - 1 : 0, // 0 index the pages to make it simpler for the database query
							post_type: post_type,
							term: params.term,
							_ajax_nonce: wp_ajax_data.nonce,
							// post_id: llms.post.id,
						};
					},
					processResults: function( data, params ) {
						return {
							results: $.map( data.items, function( item ) {
								return {
									text: item.name,
									id: item.id,
								};
							} ),
							pagination: {
								more: data.more
							}
						};

					},
				},
				cache: true,
				width: '100%',
			} );

		};

		/**
		 * Bind dom events for .llms-tables
		 * @return   void
		 * @since    3.0.0
		 * @version  3.0.0
		 */
		this.bind_tables = function() {

			$( '.llms-table button[name="llms-expand-table"]' ).on( 'click', function() {

				var $btn = $( this ),
					$table = $btn.closest( '.llms-table' )

				// switch the text on the button if alt text is found
				if ( $btn.attr( 'data-text' ) ) {
					var text = $btn.text();
					$btn.text( $btn.attr( 'data-text' ) );
					$btn.attr( 'data-text', text );
				}

				// switch classes on all expandable elements
				$table.find( '.expandable' ).each( function() {

					if ( $( this ).hasClass( 'closed' ) ) {
						$( this ).addClass( 'opened' ).removeClass( 'closed' );
					} else {
						$( this ).addClass( 'closed' ).removeClass( 'opened' );
					}

				} );

			} );

		};

		// go
		this.init();

	};

	// initalize the object
	window.llms.metaboxes = new Metaboxes();

} )( jQuery );
