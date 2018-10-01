#QUICKLOOK
Final inlined demo page is present in src/emails/one/one.template.html

#SETUP
1. Go to directory in teminal and run 
	-npm install
 	-npm run watch 
 	to start the project
2. Go to localhost:3000/one.template.html to preview the demo file for development
3. Inlined demo file will be is present in src/emails/one/one.template.html
4. The gulp-inline-css library has issues in processing media queries
	-so copy media queries which are present in last few lines in /src/css/basic/css for final demo page
	-this can be easily fixed by using another library like inline-css or css-inliner

##NOTES
1. Some styles may be repetetive, this is done to support as many clients as possible.
2. SCSS and CSS may not normal best practices and sometimes may be repetetive because the best practices for html emails is different.
3.Testing for outlook is done on web and windows. 
