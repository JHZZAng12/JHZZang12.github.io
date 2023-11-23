package org.javaro.lecture;
import java.util.ArrayList; import org.javaro.lecture.Book; import org.javaro.lecture.Student;
public class BookStore {

	public String storeName; public ArrayList<Book>books; public ArrayList<Student>students;
	public BookStore(String storeName) {
		this.storeName= storeName; books= new ArrayList<Book>(); students= new ArrayList<Student>();
	}
	public String getStoreName() {
		return this.storeName;
	}
	public ArrayList<Book>getBooks(){
		return this.books;
	}
	public ArrayList<Student>getStudents(){
		return this.students;
	}
	public void addBook (Book book) {
		this.books.add(book);
	}
	public void removeBook(Book book) {
		this.books.remove(book);
	}
	public void addStudent(Student student) {
		this.students.add(student);
	}
	public void removeStudent(Student student) {
		this.students.remove(student);
	}
	public boolean checkOut (Book book, Student student) {
	 if(book.getStudent() == null) 
	 {
		 book.setStudent(student);
		 return true;
	 }
	 else {
		 return false;
	 }
		
	}
	public boolean checkln(Book book) {
		if(book.getStudent() != null) {
			book.setStudent(null);
			return true;
		}
		else {
			return false;
		}
	}
	public ArrayList<Book> getBooksForStudent(Student student){
		ArrayList<Book> result = new ArrayList<Book>();
		for (Book aBook: this.getBooks()) {
			if((aBook.getStudent()!= null)&& (aBook.getStudent().getStudNumber().contentEquals(student.getStudNumber()))){
				result.add(aBook);
			}
		}
		return result;
	}
	public ArrayList<Book>getAvailableBooks(){
		ArrayList<Book> result = new ArrayList<Book>();
		for (Book aBook : this.getBooks()) {
			if(aBook.getStudent() == null) {
				result.add(aBook);
			}
		}
		return result;
	}
	public ArrayList<Book>getUnavailableBooks(){
		ArrayList<Book> result = new ArrayList <Book>();
		for(Book aBook : this.getBooks()) {
			if (aBook.getStudent()!= null) {
				result.add(aBook);
			}
		}
		return result;
	}
	public String toString() {
		return this.getStoreName()+"의 보유책=" +
	this.getBooks().size()+"권,회원수 ="+
	this.getStudents().size()+"명";
	}
	public void printStaus() {
		System.out.println("---도서관 현황---\n"+ this.toString());
		for (Book aBook : this.getBooks()) {
			System.out.println(aBook);
		}
		for (Student student : this.getStudents()) {
			int count= this.getBooksForStudent(student).size();
			System.out.println(student + "은/는 "+ count + "권 대출중");
		}
		System.out.println("현재 대출 가능 책:"+ this.getAvailableBooks().size());
		System.out.println("---리포트 종료 ---");
	}

	
}
