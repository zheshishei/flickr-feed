import {render} from 'react-dom';
import {combineReducers, createStore} from 'redux';
import {connect, Provider} from 'react-redux';
import React from 'react';

/* ACTIONS */

var ADD_IMAGE = 'ADD_IMAGE';
var TOGGLE_FAVORITE_IMAGE = 'TOGGLE_FAVORITE_IMAGE';
var TOGGLE_DISPLAY_FAVORITES = 'TOGGLE_DISPLAY_FAVORITES';

function addImage(image) {
    return {
        type: ADD_IMAGE,
        image_url: image.image_url,
        author: image.author
    }
}

function toggleFavoriteImage(image_url) {
    return {
        type: TOGGLE_FAVORITE_IMAGE,
        image_url: image_url
    };
}

function toggleDisplayFavorites() {
    return {
        type: TOGGLE_DISPLAY_FAVORITES
    };
}

/* REDUCERS */

function images(state, action) {
    var iMap;
    
    if (typeof state === 'undefined') {
        return {imageList:[], imageMap:{}};
    }

    switch (action.type) {
        case TOGGLE_FAVORITE_IMAGE:
            iMap = Object.assign({}, state.imageMap);
            iMap[action.image_url].favorited = !iMap[action.image_url].favorited; 

            return Object.assign({}, state, {
                imageMap: iMap
            });

        case ADD_IMAGE:
            if (!state.imageMap[action.image_url]) {
                iMap = Object.assign({}, state.imageMap);
                iMap[action.image_url] = {
                    image_url: action.image_url,
                    author: action.author,
                    favorited: false
                };

                return Object.assign({}, state, {
                    imageList: [...state.imageList, action.image_url],
                    imageMap: iMap                        
                });
            }
        default:
            return state;
    }
    return images
};

function onlyFavorites(state, action) {
    if (typeof state === 'undefined') {
        return false;
    }
    switch (action.type) {
        case TOGGLE_DISPLAY_FAVORITES:
            return !state;
        default:
            return state;
    }
};

var PhotoFeedApp = combineReducers({
    images: images,
    onlyFavorites: onlyFavorites
});

/* STORE */

var store = createStore(PhotoFeedApp);

/* PRESENTATION COMPONENTS */

class ImageTile extends React.Component {
    render () {
        var className = 'image-tile' + (this.props.favorited ? ' favorited' : '')
        return (
            <div className={className} onClick={this.props.onClick}>
                <div className="image-container">
                    <img src={this.props.source}/>
                </div>
                <div className="metadata">
                    <span>Author: {this.props.author}</span>
                </div>
            </div>
        );
    }
}

class ImageList extends React.Component {
    render () {
        var imageTiles = [];
        var onImageClick = this.props.onImageClick;
        this.props.images.forEach(function (image) {
            imageTiles.push(
                <ImageTile 
                    key={image.image_url}
                    source={image.image_url}
                    author={image.author}
                    favorited={image.favorited}
                    onClick={function() {onImageClick(image.image_url)}}/>
            );
        });

        return (
            <div className="image-grid">
                {imageTiles}
            </div>
        );
    }
}

class FavoritesButton extends React.Component {
    render () {
        var text = this.props.showOnlyFavorites ? 'Show All Photos' : 'Show Only Favorites';

        return (
            <div className="favorites-button" onClick={this.props.onClick}>{text}</div>
        );
    }
}

/* CONTAINER COMPONENTS */

var VisibleImageList = connect(
    function mapStateToProps(state) {
        var images = state.images.imageList.reduce(
            function (arr, image) {
                var i = state.images.imageMap[image];
                if (!state.onlyFavorites || i.favorited) {
                    arr.push(i);
                }
                return arr;
            }
        , []);

        return {
            images: images
        };
    },
    function mapDispatchToProps(dispatch) {
        return {
            onImageClick: function (image_url) {
                dispatch(toggleFavoriteImage(image_url))
            }
        }
    }
)(ImageList);

var FavoritesToggle = connect(
    function mapStateToProps(state) {
        return {
            showOnlyFavorites: state.onlyFavorites
        };
    },
    function mapDispatchToProps(dispatch) {
        return {
            onClick: function () {
                dispatch(toggleDisplayFavorites())
            }
        }
    }
)(FavoritesButton);

/* Render our app */

class App extends React.Component {
    render() {
        return (
            <div>
                <FavoritesToggle />
                <VisibleImageList />
            </div>
        );
    }
}

render(
    <Provider store={store}>
        <App />
    </Provider>
    , document.getElementById('photo-feed')
);

function fetchAndDispatchPhotos() {
    $.getJSON(
        'http://api.flickr.com/services/feeds/photos_public.gne?jsoncallback=?', {
        format: "json"
    })
    .done(function(data) {
        var image;
        var author;
        var image_url;

        for (var i = 0; i < data.items.length; i++) {
            image = data.items[i];
            author = image.author.slice(image.author.indexOf('("') + 2, image.author.length - 2);
            image_url = image.media.m
            store.dispatch(
                addImage({
                    author:author, 
                    image_url: image_url
                })
            );
        };
    });
};

fetchAndDispatchPhotos();

setInterval(function () {
    fetchAndDispatchPhotos();
}, 60000);
